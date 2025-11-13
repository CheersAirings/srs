import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Assignment,
  CheckCircle,
  Schedule,
  TrendingUp,
} from '@mui/icons-material';
import type { SRSStats } from '../types';
import { format } from 'date-fns';

interface DashboardProps {
  stats: SRSStats;
}

export default function Dashboard({ stats }: DashboardProps) {
  const masteryPercentage =
    stats.totalProblems > 0
      ? Math.round((stats.masteredProblems / stats.totalProblems) * 100)
      : 0;

  const StatCard = ({
    title,
    value,
    icon,
    color,
  }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
  }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
          </Box>
          <Box sx={{ color }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Dashboard
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 3,
          mb: 3,
        }}
      >
        <StatCard
          title="Total Problems"
          value={stats.totalProblems}
          icon={<Assignment sx={{ fontSize: 40 }} />}
          color="primary.main"
        />
        <StatCard
          title="Due Today"
          value={stats.problemsDueToday}
          icon={<Schedule sx={{ fontSize: 40 }} />}
          color="warning.main"
        />
        <StatCard
          title="Mastered"
          value={stats.masteredProblems}
          icon={<CheckCircle sx={{ fontSize: 40 }} />}
          color="success.main"
        />
        <StatCard
          title="Avg Ease Factor"
          value={stats.averageEaseFactor}
          icon={<TrendingUp sx={{ fontSize: 40 }} />}
          color="info.main"
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, 1fr)',
          },
          gap: 3,
        }}
      >
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Problems by Difficulty
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <Chip
                  label="Easy"
                  color="success"
                  size="small"
                  sx={{ mr: 1 }}
                />
                <Typography variant="body2">
                  {stats.problemsByDifficulty.Easy}
                </Typography>
              </Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <Chip
                  label="Medium"
                  color="warning"
                  size="small"
                  sx={{ mr: 1 }}
                />
                <Typography variant="body2">
                  {stats.problemsByDifficulty.Medium}
                </Typography>
              </Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Chip
                  label="Hard"
                  color="error"
                  size="small"
                  sx={{ mr: 1 }}
                />
                <Typography variant="body2">
                  {stats.problemsByDifficulty.Hard}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Mastery Progress
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <Typography variant="body2">
                  {stats.masteredProblems} / {stats.totalProblems} problems
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {masteryPercentage}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={masteryPercentage}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" color="textSecondary">
          Last updated: {format(new Date(), 'PPpp')}
        </Typography>
      </Box>
    </Box>
  );
}

