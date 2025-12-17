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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ModelComparisonDialog = ({ open, onClose, models }) => {
  if (!models || models.length === 0) {
    return null;
  }

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
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value, name) => [
                `${value.toFixed(2)}${name.includes('accuracy') || name.includes('precision') || name.includes('recall') || name.includes('f1') ? '%' : ''}`,
                name
              ]} />
              <Legend />
              <Bar dataKey="accuracy" fill="#4CAF50" name="Accuracy (%)" />
              <Bar dataKey="precision" fill="#2196F3" name="Precision (%)" />
              <Bar dataKey="recall" fill="#FF9800" name="Recall (%)" />
              <Bar dataKey="f1_score" fill="#9C27B0" name="F1-Score (%)" />
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
                      <strong>{model.name}</strong> v{model.version}
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
