describe('Profile Validation, Formatting & Complex Edge Cases', () => {
  describe('Indian Mobile Number Validation & Normalization', () => {
    const cleanPhone = v => (v || '').replace(/^\+91/, '').replace(/\D/g, '');
    const indianMobileRegex = /^[6-9]\d{9}$/;

    it('cleans standard 10-digit Indian mobile numbers correctly', () => {
      expect(cleanPhone('9876543210')).toBe('9876543210');
      expect(cleanPhone('+919876543210')).toBe('9876543210');
      expect(cleanPhone('+91 98765 43210')).toBe('9876543210');
      expect(cleanPhone('+91-98765-43210')).toBe('9876543210');
    });

    it('slices last 10 digits when prefixed with international country code without +', () => {
      let raw = cleanPhone('918866241204');
      if (raw.length > 10) raw = raw.slice(-10);
      expect(raw).toBe('8866241204');
      expect(indianMobileRegex.test(raw)).toBe(true);
    });

    it('validates mobile numbers starting with valid Indian digits (6, 7, 8, 9)', () => {
      expect(indianMobileRegex.test('9876543210')).toBe(true);
      expect(indianMobileRegex.test('8866241204')).toBe(true);
      expect(indianMobileRegex.test('7123456789')).toBe(true);
      expect(indianMobileRegex.test('6987654321')).toBe(true);
    });

    it('rejects numbers starting with 0, 1, 2, 3, 4, 5 (invalid Indian mobile telecom prefix)', () => {
      expect(indianMobileRegex.test('0987654321')).toBe(false);
      expect(indianMobileRegex.test('1234567890')).toBe(false);
      expect(indianMobileRegex.test('2345678901')).toBe(false);
      expect(indianMobileRegex.test('3456789012')).toBe(false);
      expect(indianMobileRegex.test('4567890123')).toBe(false);
      expect(indianMobileRegex.test('5678901234')).toBe(false);
    });

    it('rejects short numbers, long numbers, and empty strings', () => {
      expect(indianMobileRegex.test('')).toBe(false);
      expect(indianMobileRegex.test('98765')).toBe(false);
      expect(indianMobileRegex.test('987654321')).toBe(false); // 9 digits
      expect(indianMobileRegex.test('98765432101')).toBe(false); // 11 digits
    });

    it('handles bizarre edge inputs without crashing: non-numeric, unicode, null, undefined', () => {
      expect(cleanPhone(null)).toBe('');
      expect(cleanPhone(undefined)).toBe('');
      expect(cleanPhone(false)).toBe('');
      expect(cleanPhone('   ')).toBe('');
      // When emoji precedes +91, digits including 91 are preserved, and slice(-10) standardizes it to 10 digits
      let emojiPhone = cleanPhone('📱+91-98765-43210');
      if (emojiPhone.length > 10) emojiPhone = emojiPhone.slice(-10);
      expect(emojiPhone).toBe('9876543210');
      let doublePlusPhone = cleanPhone('++91919876543210');
      if (doublePlusPhone.length > 10)
        doublePlusPhone = doublePlusPhone.slice(-10);
      expect(doublePlusPhone).toBe('9876543210');
    });

    it('formats valid cleaned mobile with canonical +91 prefix', () => {
      const cleaned = cleanPhone('+91 8866241204');
      const formatted = cleaned ? `+91${cleaned}` : null;
      expect(formatted).toBe('+918866241204');

      const emptyCleaned = cleanPhone('');
      const emptyFormatted = emptyCleaned ? `+91${emptyCleaned}` : null;
      expect(emptyFormatted).toBeNull();
    });
  });

  describe('Email Format & Case Normalization', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizeEmail = email => (email || '').trim().toLowerCase();

    it('normalizes uppercase emails and extra whitespace', () => {
      expect(normalizeEmail('  URVA@CoinTrack.IN  ')).toBe('urva@cointrack.in');
      expect(normalizeEmail('Test.User+Filter@GMAIL.com')).toBe(
        'test.user+filter@gmail.com'
      );
    });

    it('validates correct email structures', () => {
      expect(emailRegex.test('urva@cointrack.in')).toBe(true);
      expect(emailRegex.test('name.surname@subdomain.domain.org')).toBe(true);
      expect(emailRegex.test('user+label@domain.co.in')).toBe(true);
    });

    it('rejects invalid email formats', () => {
      expect(emailRegex.test('')).toBe(false);
      expect(emailRegex.test('plainaddress')).toBe(false);
      expect(emailRegex.test('@missingusername.com')).toBe(false);
      expect(emailRegex.test('username@')).toBe(false);
      expect(emailRegex.test('user name@domain.com')).toBe(false);
      expect(emailRegex.test('username@domain')).toBe(false);
      expect(emailRegex.test('username@domain.')).toBe(false);
    });
  });

  describe('Password Security Rules & Strength Assessment', () => {
    const validatePassword = (
      newPassword,
      currentPassword,
      confirmPassword
    ) => {
      if (!currentPassword)
        return { valid: false, error: 'Current password required' };
      if (newPassword.length < 8)
        return {
          valid: false,
          error: 'Password must be at least 8 characters long',
        };
      if (currentPassword === newPassword)
        return {
          valid: false,
          error: 'New password must differ from current password',
        };
      if (!/[A-Z]/.test(newPassword))
        return {
          valid: false,
          error: 'Password must include at least one uppercase letter',
        };
      if (!/[a-z]/.test(newPassword))
        return {
          valid: false,
          error: 'Password must include at least one lowercase letter',
        };
      if (!/[0-9]/.test(newPassword))
        return {
          valid: false,
          error: 'Password must include at least one number',
        };
      if (!/[@$!%*?&#]/.test(newPassword))
        return {
          valid: false,
          error:
            'Password must include at least one special character (@$!%*?&#)',
        };
      if (newPassword !== confirmPassword)
        return { valid: false, error: 'New passwords do not match' };
      return { valid: true };
    };

    it('passes for passwords meeting all 5 security criteria and matching confirmation', () => {
      const res = validatePassword(
        'CoinTrack#2026',
        'OldPassword$1',
        'CoinTrack#2026'
      );
      expect(res.valid).toBe(true);
    });

    it('rejects passwords identical to current password', () => {
      const res = validatePassword(
        'SamePass#123',
        'SamePass#123',
        'SamePass#123'
      );
      expect(res.valid).toBe(false);
      expect(res.error).toBe('New password must differ from current password');
    });

    it('rejects passwords shorter than 8 characters', () => {
      const res = validatePassword('Sh0rt!', 'OldPassword$1', 'Sh0rt!');
      expect(res.valid).toBe(false);
      expect(res.error).toBe('Password must be at least 8 characters long');
    });

    it('rejects passwords missing an uppercase letter', () => {
      const res = validatePassword(
        'cointrack#2026',
        'OldPassword$1',
        'cointrack#2026'
      );
      expect(res.valid).toBe(false);
      expect(res.error).toBe(
        'Password must include at least one uppercase letter'
      );
    });

    it('rejects passwords missing a lowercase letter', () => {
      const res = validatePassword(
        'COINTRACK#2026',
        'OldPassword$1',
        'COINTRACK#2026'
      );
      expect(res.valid).toBe(false);
      expect(res.error).toBe(
        'Password must include at least one lowercase letter'
      );
    });

    it('rejects passwords missing a number', () => {
      const res = validatePassword(
        'CoinTrack#Password',
        'OldPassword$1',
        'CoinTrack#Password'
      );
      expect(res.valid).toBe(false);
      expect(res.error).toBe('Password must include at least one number');
    });

    it('rejects passwords missing an allowed special character (@$!%*?&#)', () => {
      const res = validatePassword(
        'CoinTrack2026',
        'OldPassword$1',
        'CoinTrack2026'
      );
      expect(res.valid).toBe(false);
      expect(res.error).toBe(
        'Password must include at least one special character (@$!%*?&#)'
      );
    });

    it('rejects password when confirmation does not match (case-sensitive check)', () => {
      const res = validatePassword(
        'CoinTrack#2026',
        'OldPassword$1',
        'cointrack#2026'
      );
      expect(res.valid).toBe(false);
      expect(res.error).toBe('New passwords do not match');
    });
  });

  describe('Changed Payload Derivation & Selective Updates', () => {
    const cleanPhone = v => (v || '').replace(/^\+91/, '').replace(/\D/g, '');

    const buildChangedPayload = (original, current, formattedMobile) => {
      const changed = {};
      if (current.username !== original.username)
        changed.username = current.username.trim();
      if (current.name !== original.name) changed.name = current.name;
      if ((current.bio || '') !== original.bio) changed.bio = current.bio;
      if ((current.location || '') !== original.location)
        changed.location = current.location;
      if (cleanPhone(current.phoneNumber) !== original.phoneNumber)
        changed.phoneNumber = formattedMobile;
      return changed;
    };

    it('returns empty object when no profile fields changed', () => {
      const original = {
        name: 'Urva Gandhi',
        username: 'urva_gandhi',
        bio: 'Investor',
        location: 'Gujarat',
        phoneNumber: '8866241204',
      };
      const current = { ...original };
      const payload = buildChangedPayload(original, current, '+918866241204');
      expect(Object.keys(payload)).toHaveLength(0);
    });

    it('captures only modified fields in payload', () => {
      const original = {
        name: 'Urva Gandhi',
        username: 'urva_gandhi',
        bio: 'Old Bio',
        location: 'Gujarat',
        phoneNumber: '8866241204',
      };
      const current = {
        ...original,
        bio: 'Updated Bio & Investment Strategy',
        location: 'Mumbai, Maharashtra',
      };
      const payload = buildChangedPayload(original, current, '+918866241204');
      expect(payload).toEqual({
        bio: 'Updated Bio & Investment Strategy',
        location: 'Mumbai, Maharashtra',
      });
      expect(payload.username).toBeUndefined();
      expect(payload.name).toBeUndefined();
      expect(payload.phoneNumber).toBeUndefined();
    });

    it('trims username and correctly formats modified phone number', () => {
      const original = {
        name: 'Urva Gandhi',
        username: 'urva',
        bio: '',
        location: '',
        phoneNumber: '8866241204',
      };
      const current = {
        ...original,
        username: '  urva_gandhi  ',
        phoneNumber: '+91 9876543210',
      };
      const payload = buildChangedPayload(original, current, '+919876543210');
      expect(payload.username).toBe('urva_gandhi');
      expect(payload.phoneNumber).toBe('+919876543210');
    });
  });
});
