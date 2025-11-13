import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Slider,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Delete,
  OpenInNew,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import type { Problem, Attempt } from '../types';
import { format, isToday, parseISO } from 'date-fns';

interface ProblemListProps {
  problems: Problem[];
  onDelete: (id: string) => void;
  onRecordAttempt: (id: string, attempt: Omit<Attempt, 'id' | 'date'>) => void;
  showDueOnly?: boolean;
  showMasteredOnly?: boolean;
}

export default function ProblemList({
  problems,
  onDelete,
  onRecordAttempt,
  showDueOnly = false,
  showMasteredOnly = false,
}: ProblemListProps) {
  const [attemptDialogOpen, setAttemptDialogOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [success, setSuccess] = useState(true);
  const [difficultyRating, setDifficultyRating] = useState(3);
  const [notes, setNotes] = useState('');

  const handleRecordAttempt = (problem: Problem) => {
    setSelectedProblem(problem);
    setSuccess(true);
    setDifficultyRating(3);
    setNotes('');
    setAttemptDialogOpen(true);
  };

  const handleSubmitAttempt = () => {
    if (selectedProblem) {
      onRecordAttempt(selectedProblem.id, {
        success,
        difficultyRating,
        notes: notes.trim() || undefined,
      });
      setAttemptDialogOpen(false);
      setSelectedProblem(null);
    }
  };

  const getDifficultyColor = (difficulty: Problem['difficulty']) => {
    switch (difficulty) {
      case 'Easy':
        return 'success';
      case 'Medium':
        return 'warning';
      case 'Hard':
        return 'error';
    }
  };

  const filteredProblems = problems.filter((p) => {
    if (showMasteredOnly) return p.mastered;
    if (showDueOnly) {
      const reviewDate = parseISO(p.nextReviewDate);
      return isToday(reviewDate) && !p.mastered;
    }
    return !p.mastered;
  });

  if (filteredProblems.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="textSecondary">
          No problems found
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filteredProblems.map((problem) => (
          <Card key={problem.id}>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="flex-start"
              >
                <Box sx={{ flex: 1 }}>
                  <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
                    <Typography variant="h6" component="div">
                      {problem.name}
                    </Typography>
                    <Chip
                      label={problem.difficulty}
                      color={getDifficultyColor(problem.difficulty)}
                      size="small"
                    />
                    <Chip label={problem.category} size="small" variant="outlined" />
                    {problem.mastered && (
                      <Chip
                        icon={<CheckCircle />}
                        label="Mastered"
                        color="success"
                        size="small"
                      />
                    )}
                  </Box>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ mb: 1 }}
                  >
                    <a
                      href={problem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      {problem.url}
                    </a>
                  </Typography>
                  <Box display="flex" gap={2} sx={{ mt: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Attempts: {problem.attempts.length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Ease Factor: {problem.easeFactor.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Next Review:{' '}
                      {format(parseISO(problem.nextReviewDate), 'MMM d, yyyy')}
                    </Typography>
                  </Box>
                  {problem.attempts.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="textSecondary">
                        Last attempt:{' '}
                        {format(
                          parseISO(problem.attempts[problem.attempts.length - 1].date),
                          'MMM d, yyyy'
                        )}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Box display="flex" flexDirection="column" gap={1}>
                  <IconButton
                    size="small"
                    onClick={() => window.open(problem.url, '_blank')}
                    title="Open in new tab"
                  >
                    <OpenInNew />
                  </IconButton>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => handleRecordAttempt(problem)}
                    disabled={problem.mastered}
                  >
                    Record Attempt
                  </Button>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onDelete(problem.id)}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Dialog
        open={attemptDialogOpen}
        onClose={() => setAttemptDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Record Attempt: {selectedProblem?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={success}
                  onChange={(e) => setSuccess(e.target.checked)}
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  {success ? (
                    <CheckCircle color="success" />
                  ) : (
                    <Cancel color="error" />
                  )}
                  <Typography>
                    {success ? 'Solved Successfully' : 'Failed to Solve'}
                  </Typography>
                </Box>
              }
            />
            <Box>
              <Typography gutterBottom>
                Difficulty Rating: {difficultyRating}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                How difficult was this problem for you? (0 = Very Easy, 5 = Very
                Hard)
              </Typography>
              <Slider
                value={difficultyRating}
                onChange={(_, value) => setDifficultyRating(value as number)}
                min={0}
                max={5}
                step={1}
                marks
                valueLabelDisplay="auto"
              />
            </Box>
            <TextField
              label="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="Add any notes about your solution approach, time complexity, etc."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAttemptDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitAttempt} variant="contained">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

