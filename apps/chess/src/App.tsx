import { ThemeProvider } from 'styled-components';
import './App.scss';
import { GamePage } from './pages/game_page/game_page';
import { theme } from './styles/theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <div className="App">
        <GamePage />
      </div>
    </ThemeProvider>
  );
}

export default App;
