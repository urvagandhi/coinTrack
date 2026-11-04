import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CredentialField } from '../components/CredentialField';
import { BrokerGuideTab } from '../components/BrokerGuideTab';
import { BROKERS } from '../constants';
import { toast } from 'sonner';

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Broker Security, Input Sanitization & Adversarial Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CredentialField — Masking, Obfuscation & Security Controls', () => {
    const defaultField = {
      key: 'apiKey',
      label: 'API Key',
      placeholder: 'Enter 16-character alphanumeric key',
      sensitive: false,
      helpText: 'Obtained from developer console',
    };

    const sensitiveField = {
      key: 'apiSecret',
      label: 'API Secret',
      placeholder: 'Enter 32-character secret',
      sensitive: true,
      helpText: 'Used to compute cryptographic HMAC signature',
    };

    it('renders normal unmasked text field when sensitive is false', () => {
      const onChange = jest.fn();
      render(
        <CredentialField
          field={defaultField}
          value='test_api_key_123'
          onChange={onChange}
          isSaved={false}
        />
      );

      const input = screen.getByPlaceholderText(defaultField.placeholder);
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveValue('test_api_key_123');
      expect(
        screen.getByText('Obtained from developer console')
      ).toBeInTheDocument();
      // No eye toggle button for non-sensitive fields
      expect(screen.queryByLabelText(/Show secret/i)).not.toBeInTheDocument();
    });

    it('renders masked password field by default when sensitive is true and toggles on eye click', () => {
      const onChange = jest.fn();
      render(
        <CredentialField
          field={sensitiveField}
          value='super_secret_hmac_key_999'
          onChange={onChange}
          isSaved={false}
        />
      );

      const input = screen.getByPlaceholderText(sensitiveField.placeholder);
      expect(input).toHaveAttribute('type', 'password');

      // Click eye button to reveal
      const revealBtn = screen.getByLabelText('Show secret');
      fireEvent.click(revealBtn);

      expect(input).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText('Hide secret')).toBeInTheDocument();

      // Click again to hide
      const hideBtn = screen.getByLabelText('Hide secret');
      fireEvent.click(hideBtn);
      expect(input).toHaveAttribute('type', 'password');
    });

    it('renders locked & masked display with last 4 characters when isSaved is true', () => {
      const onEdit = jest.fn();
      render(
        <CredentialField
          field={sensitiveField}
          value='abcdef1234567890xyz9876'
          onChange={jest.fn()}
          isSaved={true}
          onEdit={onEdit}
        />
      );

      expect(screen.getByText('Stored')).toBeInTheDocument();
      expect(screen.getByText('••••••••9876')).toBeInTheDocument();
      expect(
        screen.queryByPlaceholderText(sensitiveField.placeholder)
      ).not.toBeInTheDocument();
      // Help text is hidden when saved
      expect(
        screen.queryByText('Used to compute cryptographic HMAC signature')
      ).not.toBeInTheDocument();

      // Clicking Edit invokes onEdit callback
      const editBtn = screen.getByRole('button', { name: /Edit/i });
      fireEvent.click(editBtn);
      expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it('safely handles empty or short value in isSaved mode without throwing', () => {
      render(
        <CredentialField
          field={sensitiveField}
          value=''
          onChange={jest.fn()}
          isSaved={true}
        />
      );

      expect(screen.getByText('••••••••••••')).toBeInTheDocument();
    });

    it('disables input when disabled prop is true', () => {
      render(
        <CredentialField
          field={defaultField}
          value='locked_key'
          onChange={jest.fn()}
          disabled={true}
        />
      );

      const input = screen.getByPlaceholderText(defaultField.placeholder);
      expect(input).toBeDisabled();
    });
  });

  describe('Adversarial Payloads & Injection Safety in Credential Inputs', () => {
    const testField = {
      key: 'token',
      label: 'Security Token',
      placeholder: 'Enter token',
      sensitive: false,
    };

    it('safely handles SQL Injection attack strings without distortion', () => {
      const onChange = jest.fn();
      const sqliPayload = "' OR '1'='1' -- DROP TABLE broker_tokens; /*";

      render(
        <CredentialField field={testField} value='' onChange={onChange} />
      );

      const input = screen.getByPlaceholderText(testField.placeholder);
      fireEvent.change(input, { target: { value: sqliPayload } });
      expect(onChange).toHaveBeenCalledWith(sqliPayload);
    });

    it('safely handles Cross-Site Scripting (XSS) script tags without execution or corruption', () => {
      const onChange = jest.fn();
      const xssPayload =
        '<script>alert(document.cookie)</script><img src=x onerror=alert(1)>';

      render(
        <CredentialField
          field={testField}
          value={xssPayload}
          onChange={onChange}
        />
      );

      const input = screen.getByPlaceholderText(testField.placeholder);
      expect(input).toHaveValue(xssPayload);
    });

    it('handles massive token strings (10,000 characters) without UI breakage', () => {
      const massiveString = 'A'.repeat(10000);
      const onChange = jest.fn();

      render(
        <CredentialField
          field={testField}
          value={massiveString}
          onChange={onChange}
          isSaved={true}
        />
      );

      expect(screen.getByText('••••••••AAAA')).toBeInTheDocument();
    });

    it('handles unicode emojis, surrogate pairs, zero-width joiners, and null bytes cleanly', () => {
      const complexUnicode = '🔑\u0000\u200B\u200D🇮🇳_key_ñ_é';
      const onChange = jest.fn();

      render(
        <CredentialField
          field={testField}
          value={complexUnicode}
          onChange={onChange}
          isSaved={false}
        />
      );

      const input = screen.getByPlaceholderText(testField.placeholder);
      expect(input).toHaveValue(complexUnicode);
    });
  });

  describe('BrokerGuideTab — Clipboard & External Developer Portal Security', () => {
    const originalClipboard = navigator.clipboard;

    afterEach(() => {
      Object.assign(navigator, { clipboard: originalClipboard });
    });

    it('copies code to clipboard and triggers success toast notification', async () => {
      const mockWriteText = jest.fn().mockResolvedValue();
      Object.assign(navigator, {
        clipboard: { writeText: mockWriteText },
      });

      render(<BrokerGuideTab broker={BROKERS.ZERODHA} />);

      // Find copy button for redirect URL in step 2
      const copyButtons = screen.getAllByRole('button', { name: /Copy/i });
      expect(copyButtons.length).toBeGreaterThan(0);

      fireEvent.click(copyButtons[0]);

      expect(mockWriteText).toHaveBeenCalledWith(
        BROKERS.ZERODHA.setupSteps[1].code
      );
      expect(toast.success).toHaveBeenCalledWith(
        'Redirect URL copied to clipboard'
      );

      // Visual feedback shows Copied state
      expect(await screen.findByText('Copied')).toBeInTheDocument();
    });

    it('handles clipboard failure gracefully when browser denies write access', () => {
      const mockWriteText = jest
        .fn()
        .mockRejectedValue(new Error('Permission denied'));
      Object.assign(navigator, {
        clipboard: { writeText: mockWriteText },
      });

      render(<BrokerGuideTab broker={BROKERS.ZERODHA} />);

      const copyButtons = screen.getAllByRole('button', { name: /Copy/i });
      // Should not throw an uncaught rejection
      expect(() => fireEvent.click(copyButtons[0])).not.toThrow();
    });

    it('handles browser environment where navigator.clipboard is undefined without crashing', () => {
      Object.assign(navigator, { clipboard: undefined });

      render(<BrokerGuideTab broker={BROKERS.ZERODHA} />);

      const copyButtons = screen.getAllByRole('button', { name: /Copy/i });
      expect(() => fireEvent.click(copyButtons[0])).not.toThrow();
    });

    it('renders developer portal external links with secure rel="noopener noreferrer" and target="_blank"', () => {
      render(<BrokerGuideTab broker={BROKERS.ZERODHA} />);

      const portalLink = screen.getByRole('link', {
        name: /Developer Portal/i,
      });
      expect(portalLink).toHaveAttribute('href', BROKERS.ZERODHA.devPortalUrl);
      expect(portalLink).toHaveAttribute('target', '_blank');
      expect(portalLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('switches to credentials tab when "Proceed to Enter Keys" CTA is clicked', () => {
      const onSwitch = jest.fn();
      render(
        <BrokerGuideTab
          broker={BROKERS.ZERODHA}
          onSwitchToCredentials={onSwitch}
        />
      );

      const ctaBtn = screen.getByRole('button', {
        name: /Proceed to Enter Keys/i,
      });
      fireEvent.click(ctaBtn);
      expect(onSwitch).toHaveBeenCalledTimes(1);
    });

    it('supports embedded compact layout mode for side-by-side or modal displays', () => {
      render(<BrokerGuideTab broker={BROKERS.UPSTOX} isEmbedded={true} />);

      expect(screen.getByText('Setup Instructions')).toBeInTheDocument();
      expect(
        screen.getByText(`${BROKERS.UPSTOX.setupSteps.length} Steps`)
      ).toBeInTheDocument();
    });
  });
});
