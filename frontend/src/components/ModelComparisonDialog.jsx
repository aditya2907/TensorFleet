import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { monoFontFamily } from '../theme/typography';

const ModelComparisonDialog = ({ open, onClose, models }) => {
  const theme = useTheme();

  if (!models || models.length === 0) {
    return null;
  }

  const seriesColors = {
    accuracy: theme.palette.success.main,
    precision: theme.palette.primary.main,
    recall: theme.palette.warning.main,
    f1_score: theme.palette.secondary.main,
  };
  const axisTick = { fill: theme.palette.text.secondary, fontSize: 12 };

  const metricsData = models.map(model => ({
    name: `${model.name} v${model.version}`,
    accuracy: (model.evaluation_metrics?.accuracy || model.metrics?.test_accuracy || 0) * 100,
    precision: (model.evaluation_metrics?.precision || 0) * 100,
    recall: (model.evaluation_metrics?.recall || 0) * 100,
    f1_score: (model.evaluation_metrics?.f1_score || 0) * 100,
    loss: model.evaluation_metrics?.loss || model.metrics?.test_loss || 0,
  }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Model Comparison</DialogTitle>
      <DialogContent>
        <Typography variant="h6" gutterBottom>Metrics Chart</Typography>
        <Box sx={{ height: 400, mb: 4 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metricsData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={axisTick}
                stroke={theme.palette.divider}
              />
              <YAxis tick={axisTick} stroke={theme.palette.divider} />
              <Tooltip
                formatter={(value, name) => [
                  `${value.toFixed(2)}${name.includes('accuracy') || name.includes('precision') || name.includes('recall') || name.includes('f1') ? '%' : ''}`,
                  name
                ]}
                cursor={{ fill: alpha(theme.palette.grey[500], 0.08) }}
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 8,
                  color: theme.palette.text.primary,
                }}
                labelStyle={{ color: theme.palette.text.primary }}
              />
              <Legend wrapperStyle={{ color: theme.palette.text.secondary }} />
              <Bar dataKey="accuracy" fill={seriesColors.accuracy} name="Accuracy (%)" />
              <Bar dataKey="precision" fill={seriesColors.precision} name="Precision (%)" />
              <Bar dataKey="recall" fill={seriesColors.recall} name="Recall (%)" />
              <Bar dataKey="f1_score" fill={seriesColors.f1_score} name="F1-Score (%)" />
            </BarChart>
          </ResponsiveContainer>
        </Box>

        <Typography variant="h6" gutterBottom>Details Table</Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Model Name</TableCell>
                <TableCell>Algorithm</TableCell>
                <TableCell>Accuracy</TableCell>
                <TableCell>Precision</TableCell>
                <TableCell>Recall</TableCell>
                <TableCell>F1-Score</TableCell>
                <TableCell>Loss</TableCell>
                <TableCell>Training Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {models.map((model) => {
                const modelId = model.id || model._id;
                const metrics = model.evaluation_metrics || model.metrics || {};
                return (
                  <TableRow key={modelId}>
                    <TableCell>
                      <Typography
                        component="span"
                        variant="body2"
                        sx={{ fontFamily: monoFontFamily, fontWeight: 600 }}
                      >
                        {model.name}
                      </Typography>{' '}
                      v{model.version}
                    </TableCell>
                    <TableCell>{model.algorithm_details?.architecture || model.algorithm}</TableCell>
                    <TableCell>
                      <Box sx={{ color: metrics.accuracy > 0.9 ? 'success.main' : 'text.primary' }}>
                        {((metrics.accuracy || metrics.test_accuracy || 0) * 100).toFixed(2)}%
                      </Box>
                    </TableCell>
                    <TableCell>{((metrics.precision || 0) * 100).toFixed(2)}%</TableCell>
                    <TableCell>{((metrics.recall || 0) * 100).toFixed(2)}%</TableCell>
                    <TableCell>
                      <Box sx={{ color: metrics.f1_score > 0.85 ? 'success.main' : 'text.primary' }}>
                        {((metrics.f1_score || 0) * 100).toFixed(2)}%
                      </Box>
                    </TableCell>
                    <TableCell>{(metrics.loss || metrics.test_loss || 0).toFixed(4)}</TableCell>
                    <TableCell>{metrics.training_time || 'N/A'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
    </Dialog>
  );
};

export default ModelComparisonDialog;
