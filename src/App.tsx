import { useState } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Tabs,
  Tab,
  Fab,
  Button,
} from '@mui/material';
import { Add, Dashboard as DashboardIcon, List, CheckCircle } from '@mui/icons-material';
import { useProblems } from './hooks/useProblems';
import { calculateStats } from './utils/stats';
import { getProblemsDueToday, getMasteredProblems } from './utils/srs';
import Dashboard from './components/Dashboard';
import ProblemList from './components/ProblemList';
import ProblemForm from './components/ProblemForm';
import { buildExportJson, importFromJsonText } from './utils/storage';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function App() {
  const [tabValue, setTabValue] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const { problems, loading, addProblem, recordAttempt, deleteProblem, reloadProblems } =
    useProblems();

  const stats = calculateStats(problems);
  const problemsDueToday = getProblemsDueToday(problems);
  const masteredProblems = getMasteredProblems(problems);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddProblem = (
    name: string,
    url: string,
    difficulty: 'Easy' | 'Medium' | 'Hard',
    category: string
  ) => {
    addProblem(name, url, difficulty, category);
  };

  const handleExport = () => {
    const json = buildExportJson();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date();
    const stamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}`;
    a.href = url;
    a.download = `leetcode-srs-backup-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      importFromJsonText(text);
      reloadProblems();
    } catch {
      // Silently fail import - could add error notification here if needed
    }
  };

  const fileInputId = 'import-backup-input';

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container>
          <Typography>Loading...</Typography>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            LeetCode SRS
          </Typography>
          <input
            id={fileInputId}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleImportFile(file);
                // Reset input value to allow re-importing the same file name
                e.currentTarget.value = '';
              }
            }}
          />
          <Button color="inherit" onClick={handleExport} sx={{ mr: 1 }}>
            Export
          </Button>
          <Button
            color="inherit"
            onClick={() => document.getElementById(fileInputId)?.click()}
          >
            Import
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab
              icon={<DashboardIcon />}
              iconPosition="start"
              label="Dashboard"
            />
            <Tab icon={<List />} iconPosition="start" label="Due Today" />
            <Tab
              icon={<CheckCircle />}
              iconPosition="start"
              label="Mastered"
            />
            <Tab icon={<List />} iconPosition="start" label="All Problems" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Dashboard stats={stats} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h5" gutterBottom>
            Problems Due Today ({problemsDueToday.length})
          </Typography>
          <ProblemList
            problems={problemsDueToday}
            onDelete={deleteProblem}
            onRecordAttempt={recordAttempt}
            showDueOnly={true}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h5" gutterBottom>
            Mastered Problems ({masteredProblems.length})
          </Typography>
          <ProblemList
            problems={masteredProblems}
            onDelete={deleteProblem}
            onRecordAttempt={recordAttempt}
            showMasteredOnly={true}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography variant="h5" gutterBottom>
            All Problems ({problems.length})
          </Typography>
          <ProblemList
            problems={problems}
            onDelete={deleteProblem}
            onRecordAttempt={recordAttempt}
          />
        </TabPanel>
      </Container>

      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        onClick={() => setFormOpen(true)}
      >
        <Add />
      </Fab>

      <ProblemForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleAddProblem}
      />
    </ThemeProvider>
  );
}

export default App;
