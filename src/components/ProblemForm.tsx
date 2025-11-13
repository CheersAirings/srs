import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
} from '@mui/material';
import type { Difficulty } from '../types';

interface ProblemFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    name: string,
    url: string,
    difficulty: Difficulty,
    category: string
  ) => void;
}

const difficulties: Difficulty[] = ['Easy', 'Medium', 'Hard'];

const categories = [
  'Array',
  'String',
  'Linked List',
  'Tree',
  'Graph',
  'Dynamic Programming',
  'Backtracking',
  'Greedy',
  'Binary Search',
  'Two Pointers',
  'Sliding Window',
  'Stack',
  'Queue',
  'Heap',
  'Hash Table',
  'Math',
  'Bit Manipulation',
  'Other',
];

export default function ProblemForm({
  open,
  onClose,
  onSubmit,
}: ProblemFormProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [category, setCategory] = useState('Array');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = 'Problem name is required';
    }
    if (!url.trim()) {
      newErrors.url = 'Problem URL is required';
    } else if (!url.match(/^https?:\/\/.+/)) {
      newErrors.url = 'Please enter a valid URL';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(name, url, difficulty, category);
      handleClose();
    }
  };

  const handleClose = () => {
    setName('');
    setUrl('');
    setDifficulty('Medium');
    setCategory('Array');
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Problem</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Problem Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            error={!!errors.name}
            helperText={errors.name}
            placeholder="e.g., Two Sum"
          />
          <TextField
            label="Problem URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            fullWidth
            required
            error={!!errors.url}
            helperText={errors.url}
            placeholder="https://leetcode.com/problems/two-sum/"
          />
          <TextField
            select
            label="Difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            fullWidth
            required
          >
            {difficulties.map((diff) => (
              <MenuItem key={diff} value={diff}>
                {diff}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            fullWidth
            required
          >
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Add Problem
        </Button>
      </DialogActions>
    </Dialog>
  );
}

