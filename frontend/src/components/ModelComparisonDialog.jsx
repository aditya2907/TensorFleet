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
    accuracy: model.metrics?.test_accuracy || 0,
    loss: model.metrics?.test_loss || 0,
  }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Model Comparison</DialogTitle>
      <DialogContent>
        <Typography variant="h6" gutterBottom>Metrics Chart</Typography>
        <Box sx={{ height: 300, mb: 4 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metricsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="accuracy" fill="#8884d8" name="Test Accuracy" />
              <Bar dataKey="loss" fill="#82ca9d" name="Test Loss" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
        
        <Typography variant="h6" gutterBottom>Details Table</Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Model Name</TableCell>
                <TableCell>Version</TableCell>
                <TableCell>Algorithm</TableCell>
                <TableCell>Test Accuracy</TableCell>
                <TableCell>Test Loss</TableCell>
                <TableCell>Created At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {models.map((model) => {
                const modelId = model.id || model._id;
                return (
                  <TableRow key={modelId}>
                    <TableCell>{model.name}</TableCell>
                    <TableCell>{model.version}</TableCell>
                    <TableCell>{model.algorithm}</TableCell>
                    <TableCell>{model.metrics?.test_accuracy?.toFixed(4) || 'N/A'}</TableCell>
                    <TableCell>{model.metrics?.test_loss?.toFixed(4) || 'N/A'}</TableCell>
                    <TableCell>{new Date(model.created_at).toLocaleString()}</TableCell>
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
