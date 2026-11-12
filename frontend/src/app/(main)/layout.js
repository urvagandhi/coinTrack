import MainShell from './MainShell';

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function Layout({ children }) {
  return <MainShell>{children}</MainShell>;
}
