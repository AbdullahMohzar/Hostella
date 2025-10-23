import { useTheme } from './ThemeContext';

function Header() {
  const { darkMode, toggleTheme } = useTheme();
  return (
    <header>
      <button onClick={toggleTheme}>{darkMode ? 'Light Mode' : 'Dark Mode'}</button>
    </header>
  );
}

export default Header;