import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProfileSidebar } from '../components/ProfileSidebar';

describe('ProfileSidebar Component Integration', () => {
  const mockTabs = [
    { id: 'profile', label: 'My Profile' },
    { id: 'security', label: 'Security Options' },
    { id: 'preferences', label: 'Preferences' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'danger', label: 'Danger Zone' },
  ];

  it('renders all 5 navigation tabs and the settings header', () => {
    const onTabChange = jest.fn();
    render(<ProfileSidebar activeTab='profile' onTabChange={onTabChange} />);

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(
      screen.getByText('You can find all settings here.')
    ).toBeInTheDocument();

    mockTabs.forEach(tab => {
      expect(screen.getByText(tab.label)).toBeInTheDocument();
    });
  });

  it('indicates the active tab visually and triggers onTabChange when clicked', () => {
    const onTabChange = jest.fn();
    render(
      <ProfileSidebar activeTab='preferences' onTabChange={onTabChange} />
    );

    const prefButton = screen.getByText('Preferences').closest('button');
    expect(prefButton).toBeInTheDocument();

    const securityButton = screen
      .getByText('Security Options')
      .closest('button');
    fireEvent.click(securityButton);

    expect(onTabChange).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith('security');
  });

  it('calls onTabChange with danger when Danger Zone is selected', () => {
    const onTabChange = jest.fn();
    render(<ProfileSidebar activeTab='profile' onTabChange={onTabChange} />);

    const dangerButton = screen.getByText('Danger Zone').closest('button');
    fireEvent.click(dangerButton);

    expect(onTabChange).toHaveBeenCalledWith('danger');
  });
});
