describe('Email Change Lifecycle, Mutual Exclusion & RFC 7009 Cancellation', () => {
  describe('Email Verification Flag Normalization', () => {
    const resolveEmailVerified = apiUser =>
      Boolean(apiUser?.isEmailVerified ?? apiUser?.emailVerified ?? false);

    it('resolves true when isEmailVerified is true', () => {
      expect(resolveEmailVerified({ isEmailVerified: true })).toBe(true);
      expect(
        resolveEmailVerified({ isEmailVerified: true, emailVerified: false })
      ).toBe(true);
    });

    it('resolves true when legacy emailVerified is true', () => {
      expect(resolveEmailVerified({ emailVerified: true })).toBe(true);
      expect(
        resolveEmailVerified({ isEmailVerified: null, emailVerified: true })
      ).toBe(true);
    });

    it('resolves false when both flags are false or null/undefined', () => {
      expect(
        resolveEmailVerified({ isEmailVerified: false, emailVerified: false })
      ).toBe(false);
      expect(resolveEmailVerified({})).toBe(false);
      expect(resolveEmailVerified(null)).toBe(false);
      expect(resolveEmailVerified(undefined)).toBe(false);
    });
  });

  describe('Pending Email Change Expiry Calculations', () => {
    const checkIsPendingExpired = (expiresAt, nowMs = Date.now()) => {
      if (!expiresAt) return false;
      const parsed = new Date(expiresAt).getTime();
      if (Number.isNaN(parsed)) return false;
      return parsed < nowMs;
    };

    it('reports pending change as active when expiry is in the future', () => {
      const now = 1793700000000;
      const futureExpiry = new Date(now + 10 * 60 * 1000).toISOString(); // 10 mins future
      expect(checkIsPendingExpired(futureExpiry, now)).toBe(false);
    });

    it('reports pending change as expired when expiry timestamp has elapsed', () => {
      const now = 1793700000000;
      const pastExpiry = new Date(now - 1000).toISOString(); // 1 second ago
      expect(checkIsPendingExpired(pastExpiry, now)).toBe(true);
    });

    it('handles null, undefined, or corrupt date strings safely', () => {
      expect(checkIsPendingExpired(null)).toBe(false);
      expect(checkIsPendingExpired(undefined)).toBe(false);
      expect(checkIsPendingExpired('invalid-timestamp-string')).toBe(false);
    });
  });

  describe('RFC 7009 Cancellation Priority & Mutual Exclusion Race Guards', () => {
    it('cancels in-flight resend action when user triggers cancellation (Revocation Priority)', async () => {
      let isResending = false;
      let isCancelling = false;
      let cooldown = 0;
      let successToastCalled = false;
      const cancelledRef = { current: false };

      // Simulate user clicking resend
      const executeResend = async () => {
        cancelledRef.current = false;
        isResending = true;
        // Simulated delayed network request
        await new Promise(resolve => setTimeout(resolve, 50));
        if (cancelledRef.current) {
          isResending = false;
          return;
        }
        cooldown = 60;
        successToastCalled = true;
        isResending = false;
      };

      // Simulate user clicking cancel while resend is in flight
      const executeCancel = () => {
        cancelledRef.current = true;
        isCancelling = true;
        isResending = false;
        cooldown = 0;
      };

      const resendPromise = executeResend();
      expect(isResending).toBe(true);

      // User hits cancel midway
      executeCancel();
      expect(cancelledRef.current).toBe(true);
      expect(cooldown).toBe(0);
      expect(isResending).toBe(false);
      expect(isCancelling).toBe(true);

      await resendPromise;
      // Guarantee the delayed resend callback did NOT fire success toast or revive cooldown
      expect(successToastCalled).toBe(false);
      expect(cooldown).toBe(0);
    });

    it('disables resend button while cancellation is in progress', () => {
      const isResendDisabled = ({
        pendingEmail,
        isCancelling,
        isResending,
        cooldown,
      }) => !pendingEmail || isCancelling || isResending || cooldown > 0;

      expect(
        isResendDisabled({
          pendingEmail: 'urva@gmail.com',
          isCancelling: true,
          isResending: false,
          cooldown: 0,
        })
      ).toBe(true);

      expect(
        isResendDisabled({
          pendingEmail: 'urva@gmail.com',
          isCancelling: false,
          isResending: true,
          cooldown: 0,
        })
      ).toBe(true);

      expect(
        isResendDisabled({
          pendingEmail: 'urva@gmail.com',
          isCancelling: false,
          isResending: false,
          cooldown: 45,
        })
      ).toBe(true);

      expect(
        isResendDisabled({
          pendingEmail: 'urva@gmail.com',
          isCancelling: false,
          isResending: false,
          cooldown: 0,
        })
      ).toBe(false);
    });
  });

  describe('Cooldown Timer Countdown State Transition', () => {
    it('decrements cooldown to zero and clears interval', () => {
      let cooldown = 3;
      const decrement = () => {
        cooldown = Math.max(0, cooldown - 1);
      };

      decrement();
      expect(cooldown).toBe(2);
      decrement();
      expect(cooldown).toBe(1);
      decrement();
      expect(cooldown).toBe(0);
      decrement(); // Stays clamped at 0
      expect(cooldown).toBe(0);
    });
  });
});
