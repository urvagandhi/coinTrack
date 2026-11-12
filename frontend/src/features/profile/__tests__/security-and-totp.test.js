describe('Security Options & TOTP 2FA State Machine', () => {
  describe('TOTP Code Input Validation', () => {
    const validateTotpInput = (code, isBackup = false) => {
      const targetLen = isBackup ? 8 : 6;
      if (!code)
        return { valid: false, error: `Enter ${targetLen}-digit code` };
      const clean = code.trim();
      if (!/^\d+$/.test(clean)) return { valid: false, error: 'Digits only' };
      if (clean.length !== targetLen) {
        return {
          valid: false,
          error: `Enter ${isBackup ? '8-digit backup' : '6-digit'} code`,
        };
      }
      return { valid: true, clean };
    };

    it('accepts valid 6-digit TOTP codes', () => {
      expect(validateTotpInput('123456')).toEqual({
        valid: true,
        clean: '123456',
      });
      expect(validateTotpInput('000123')).toEqual({
        valid: true,
        clean: '000123',
      });
    });

    it('rejects short or long TOTP codes', () => {
      expect(validateTotpInput('12345').valid).toBe(false);
      expect(validateTotpInput('1234567').valid).toBe(false);
    });

    it('rejects non-numeric characters in TOTP codes', () => {
      expect(validateTotpInput('12345a').valid).toBe(false);
      expect(validateTotpInput('12-345').valid).toBe(false);
      expect(validateTotpInput(' 1234 ').valid).toBe(false);
    });

    it('accepts valid 8-digit backup codes in backup reset mode', () => {
      expect(validateTotpInput('12345678', true)).toEqual({
        valid: true,
        clean: '12345678',
      });
    });

    it('rejects invalid backup code lengths', () => {
      expect(validateTotpInput('123456', true).valid).toBe(false); // 6 digits is invalid for backup
      expect(validateTotpInput('123456789', true).valid).toBe(false); // 9 digits
    });
  });

  describe('3-Step TOTP Reset Workflow Machine', () => {
    const createResetWorkflow = () => {
      let step = 'verify'; // 'verify' | 'setup' | 'backup'
      let secretData = null;
      let backupCodes = [];

      return {
        getStep: () => step,
        getSecretData: () => secretData,
        getBackupCodes: () => backupCodes,
        submitVerification: (code, mockResponse) => {
          if (!code || code.length < 6) throw new Error('Invalid code');
          secretData = mockResponse;
          step = 'setup';
        },
        submitNewSetup: (code, mockBackupCodes) => {
          if (!code || code.length !== 6) throw new Error('Invalid TOTP');
          backupCodes = mockBackupCodes;
          step = 'backup';
        },
        finish: () => {
          step = 'verify';
          secretData = null;
          backupCodes = [];
        },
      };
    };

    it('progresses linearly through Step 1 (verify) -> Step 2 (setup) -> Step 3 (backup)', () => {
      const workflow = createResetWorkflow();
      expect(workflow.getStep()).toBe('verify');

      // Step 1: Verify current TOTP
      workflow.submitVerification('654321', {
        secret: 'JBSWY3DPEHPK3PXP',
        qrCode: 'data:image/png;base64,mock',
      });
      expect(workflow.getStep()).toBe('setup');
      expect(workflow.getSecretData().secret).toBe('JBSWY3DPEHPK3PXP');

      // Step 2: Confirm new TOTP code
      const generatedCodes = [
        '11223344',
        '55667788',
        '99001122',
        '33445566',
        '77889900',
        '12345678',
        '87654321',
        '43218765',
      ];
      workflow.submitNewSetup('123456', generatedCodes);
      expect(workflow.getStep()).toBe('backup');
      expect(workflow.getBackupCodes()).toEqual(generatedCodes);

      // Finish / close
      workflow.finish();
      expect(workflow.getStep()).toBe('verify');
    });
  });

  describe('Backup Codes Download Formatting', () => {
    const generateBackupFileContent = (username, codes) => {
      const timestamp = new Date().toISOString();
      const codeList = codes.map((c, i) => `${i + 1}. ${c}`).join('\n');
      return (
        `===========================================\n` +
        `COINTRACK 2FA BACKUP RECOVERY CODES\n` +
        `Account: ${username}\n` +
        `Generated: ${timestamp}\n` +
        `===========================================\n\n` +
        `IMPORTANT: Each code can only be used once.\n` +
        `Store this document in an encrypted or secure location.\n\n` +
        `${codeList}\n`
      );
    };

    it('formats backup code text file with account metadata and all 8 codes', () => {
      const codes = [
        'A1B2C3D4',
        'E5F6G7H8',
        'I9J0K1L2',
        'M3N4O5P6',
        'Q7R8S9T0',
        'U1V2W3X4',
        'Y5Z6A7B8',
        'C9D0E1F2',
      ];
      const content = generateBackupFileContent('urva_gandhi', codes);

      expect(content).toContain('COINTRACK 2FA BACKUP RECOVERY CODES');
      expect(content).toContain('Account: urva_gandhi');
      codes.forEach((code, index) => {
        expect(content).toContain(`${index + 1}. ${code}`);
      });
    });
  });
});
