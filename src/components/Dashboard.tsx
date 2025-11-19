import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
} from '@mui/material';
import {
  Assignment,
  CheckCircle,
  Schedule,
  TrendingUp,
} from '@mui/icons-material';
import type { ActivityHeatmapMode, SRSStats } from '../types';
import { addDays, differenceInCalendarDays, endOfWeek, format, startOfWeek } from 'date-fns';
import { useState } from 'react';

interface DashboardProps {
  stats: SRSStats;
}

export default function Dashboard({ stats }: DashboardProps) {
  const [heatmapMode, setHeatmapMode] =
    useState<ActivityHeatmapMode>('windowYear');
  const masteryPercentage =
    stats.totalProblems > 0
      ? Math.round((stats.masteredProblems / stats.totalProblems) * 100)
      : 0;
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const activeHeatmap = stats.activityHeatmap[heatmapMode];
  const actualHeatmapStart = new Date(activeHeatmap.startDate);
  const actualHeatmapEnd = new Date(activeHeatmap.endDate);
  const calendarStart = startOfWeek(actualHeatmapStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(actualHeatmapEnd, { weekStartsOn: 1 });
  const totalDays = differenceInCalendarDays(calendarEnd, calendarStart) + 1;
  const totalWeeks = Math.max(1, Math.ceil(totalDays / 7));
  const weeks = Array.from({ length: totalWeeks }, (_, weekIdx) =>
    Array.from({ length: 7 }, (_, dayIdx) => {
      const date = addDays(calendarStart, weekIdx * 7 + dayIdx);
      const iso = format(date, 'yyyy-MM-dd');
      const withinRange = date >= actualHeatmapStart && date <= actualHeatmapEnd;
      return {
        date,
        iso,
        count: withinRange ? activeHeatmap.values[iso] ?? 0 : null,
      };
    })
  );
  const counts = weeks
    .flat()
    .filter((cell) => cell.count !== null)
    .map((cell) => cell.count as number);
  const maxCount = counts.length > 0 ? Math.max(...counts) : 0;
  const colorScale = ['#ECEFF1', '#C5E1F5', '#90CAF9', '#42A5F5', '#1E88E5'];
  const getCellColor = (value: number | null) => {
    if (value === null) {
      return 'transparent';
    }
    if (value === 0 || maxCount === 0) {
      return colorScale[0];
    }
    const level = Math.min(
      colorScale.length - 1,
      Math.floor((value / maxCount) * (colorScale.length - 1))
    );
    return colorScale[level];
  };
  const hasActivity = counts.some((count) => count > 0);

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
        <Card>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 1,
              }}
            >
              <Box>
                <Typography variant="h6" gutterBottom>
                  Activity Heatmap
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Daily attempts over the past year. Darker squares mean more activity.
                </Typography>
              </Box>
              <ToggleButtonGroup
                size="small"
                value={heatmapMode}
                exclusive
                onChange={(_event, mode) =>
                  setHeatmapMode(mode ?? 'windowYear')
                }
                color="primary"
              >
                <ToggleButton value="windowYear">Rolling year</ToggleButton>
                <ToggleButton value="calendarYear">Calendar year</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Box sx={{ mt: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 2,
                  overflowX: 'auto',
                  pb: 1,
                }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateRows: 'repeat(7, 14px)',
                    gap: 0.5,
                  }}
                >
                  {dayLabels.map((label) => (
                    <Typography
                      key={label}
                      variant="caption"
                      sx={{
                        height: 14,
                        lineHeight: '14px',
                        textTransform: 'uppercase',
                        color: 'text.secondary',
                      }}
                    >
                      {label}
                    </Typography>
                  ))}
                </Box>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${totalWeeks}, 14px)`,
                    gridTemplateRows: 'repeat(7, 14px)',
                    gridAutoFlow: 'column',
                    gap: 0.5,
                  }}
                >
                  {weeks.map((week, weekIdx) =>
                    week.map((cell, dayIdx) => {
                      const attempts = cell.count ?? 0;
                      const attemptLabel =
                        cell.count === null
                          ? 'Outside selected range'
                          : `${attempts} attempt${attempts === 1 ? '' : 's'}`;
                      return (
                        <Tooltip
                          key={`${cell.iso}-${weekIdx}-${dayIdx}`}
                          title={`${format(cell.date, 'MMM d, yyyy')} · ${attemptLabel}`}
                          arrow
                          enterTouchDelay={0}
                        >
                          <Box
                            sx={{
                              width: 14,
                              height: 14,
                              borderRadius: 1,
                              backgroundColor: getCellColor(cell.count),
                              border:
                                cell.count === null
                                  ? '1px solid rgba(0,0,0,0.05)'
                                  : '1px solid transparent',
                            }}
                          />
                        </Tooltip>
                      );
                    })
                  )}
                </Box>
              </Box>
              {!hasActivity && (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  No attempts recorded yet. Log activity to populate the heatmap.
                </Typography>
              )}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mt: 2,
                  flexWrap: 'wrap',
                }}
              >
                <Typography variant="caption">Less</Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {colorScale.map((color, idx) => (
                    <Box
                      key={`${color}-${idx}`}
                      sx={{
                        width: 14,
                        height: 14,
                        borderRadius: 1,
                        backgroundColor: color,
                        border:
                          idx === 0 ? '1px solid rgba(0,0,0,0.05)' : '1px solid transparent',
                      }}
                    />
                  ))}
                </Box>
                <Typography variant="caption">More</Typography>
                <Box sx={{ flexGrow: 1 }} />
                <Typography variant="caption" color="textSecondary">
                  {format(actualHeatmapStart, 'MMM d, yyyy')} –{' '}
                  {format(actualHeatmapEnd, 'MMM d, yyyy')}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
          Last updated: {format(new Date(), 'PPpp')}
        </Typography>
      </Box>
    </Box>
  );
}

