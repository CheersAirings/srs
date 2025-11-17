import { useMemo, useState } from 'react';
import type { Problem } from './types';
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
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
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
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>(
    'All'
  );
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const { problems, loading, addProblem, updateProblem, recordAttempt, deleteProblem, reloadProblems } =
    useProblems();

  const stats = calculateStats(problems);
  const problemsDueToday = getProblemsDueToday(problems);
  const masteredProblems = getMasteredProblems(problems);
  const categoryOptions = useMemo(
    () =>
      Array.from(new Set(problems.map((problem) => problem.category).filter(Boolean))).sort(),
    [problems]
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredAllProblems = problems.filter((problem) => {
    const matchesDifficulty =
      difficultyFilter === 'All' || problem.difficulty === difficultyFilter;
    const matchesCategory = categoryFilter === 'All' || problem.category === categoryFilter;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      [problem.name, problem.url, problem.category].some((field) =>
        field.toLowerCase().includes(normalizedQuery)
      );
    return matchesDifficulty && matchesCategory && matchesQuery;
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddProblem = (
    name: string,
    url: string,
    difficulty: 'Easy' | 'Medium' | 'Hard',
    category: string
  ) => {
    if (editingProblem) {
      // Update existing problem
      const updatedProblem: Problem = {
        ...editingProblem,
        name,
        url,
        difficulty,
        category,
      };
      updateProblem(updatedProblem);
      setEditingProblem(null);
    } else {
      // Add new problem
      addProblem(name, url, difficulty, category);
    }
  };

  const handleEditProblem = (problem: Problem) => {
    setEditingProblem(problem);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingProblem(null);
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
            onEdit={handleEditProblem}
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
            onEdit={handleEditProblem}
            showMasteredOnly={true}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography variant="h5" gutterBottom>
            All Problems ({problems.length})
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              mb: 3,
            }}
          >
            <ToggleButtonGroup
              value={difficultyFilter}
              exclusive
              onChange={(_event, newValue) =>
                setDifficultyFilter(newValue ?? 'All')
              }
              size="small"
              color="primary"
            >
              <ToggleButton value="All">All</ToggleButton>
              <ToggleButton value="Easy">Easy</ToggleButton>
              <ToggleButton value="Medium">Medium</ToggleButton>
              <ToggleButton value="Hard">Hard</ToggleButton>
            </ToggleButtonGroup>

            {categoryOptions.length > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                }}
              >
                <Chip
                  label="All Categories"
                  variant={categoryFilter === 'All' ? 'filled' : 'outlined'}
                  color={categoryFilter === 'All' ? 'primary' : 'default'}
                  onClick={() => setCategoryFilter('All')}
                  size="small"
                />
                {categoryOptions.map((category) => (
                  <Chip
                    key={category}
                    label={category}
                    variant={categoryFilter === category ? 'filled' : 'outlined'}
                    color={categoryFilter === category ? 'primary' : 'default'}
                    onClick={() =>
                      setCategoryFilter((prev) => (prev === category ? 'All' : category))
                    }
                    size="small"
                  />
                ))}
              </Box>
            )}

            <TextField
              label="Search"
              placeholder="Search by name, URL, or category"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              fullWidth
              size="small"
            />
          </Box>
          <ProblemList
            problems={filteredAllProblems}
            onDelete={deleteProblem}
            onRecordAttempt={recordAttempt}
            onEdit={handleEditProblem}
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
        onClick={() => {
          setEditingProblem(null);
          setFormOpen(true);
        }}
      >
        <Add />
      </Fab>

      <ProblemForm
        open={formOpen}
        onClose={handleCloseForm}
        onSubmit={handleAddProblem}
        problem={editingProblem}
      />
    </ThemeProvider>
  );
}

export default App;
