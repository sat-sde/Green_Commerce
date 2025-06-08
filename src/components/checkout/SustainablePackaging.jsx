import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  Paper,
  Divider,
  Tooltip,
  IconButton,
  Grid,
  Chip,
  LinearProgress,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import EcoIcon from '@mui/icons-material/Eco';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import RecyclingIcon from '@mui/icons-material/Recycling';

const SustainablePackaging = ({ packagingOptions, onChange, defaultValue = null }) => {
  const [selectedPackaging, setSelectedPackaging] = useState(defaultValue || '');
  const [packagingImpact, setPackagingImpact] = useState({});

  // Map impact level to color
  const getImpactColor = (impact) => {
    switch (impact.toLowerCase()) {
      case 'low':
        return '#4caf50'; // Green
      case 'medium':
        return '#ff9800'; // Orange
      case 'high':
        return '#f44336'; // Red
      default:
        return '#9e9e9e'; // Grey
    }
  };

  // Format additional price display
  const formatPrice = (price) => {
    if (price === 0) return 'No additional cost';
    return `+${price.toFixed(2)}`;
  };

  // Calculate relative impact for progress bar
  const calculateImpactPercentage = (impact) => {
    switch (impact.toLowerCase()) {
      case 'low':
        return 33;
      case 'medium':
        return 66;
      case 'high':
        return 100;
      default:
        return 0;
    }
  };

  useEffect(() => {
    if (selectedPackaging && onChange) {
      const selected = packagingOptions.find(option => option.id === selectedPackaging);
      onChange(selected);
    }
  }, [selectedPackaging, packagingOptions, onChange]);

  const handlePackagingChange = (event) => {
    setSelectedPackaging(event.target.value);
  };

  if (!packagingOptions || packagingOptions.length === 0) {
    return (
      <Box sx={{ my: 3 }}>
        <Typography variant="subtitle1">
          No sustainable packaging options available for this order.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ my: 3 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <EcoIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" component="h2">
          Sustainable Packaging Options
        </Typography>
        <Tooltip title="Choose eco-friendly packaging to reduce your environmental impact and track your carbon savings">
          <IconButton size="small" sx={{ ml: 1 }}>
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Choose the packaging option that aligns with your sustainability goals. Each option has different environmental impacts and carbon savings.
      </Typography>
      
      <RadioGroup
        value={selectedPackaging}
        onChange={handlePackagingChange}
        name="packaging-options"
      >
        {packagingOptions.map((option) => (
          <Paper 
            key={option.id} 
            elevation={selectedPackaging === option.id ? 3 : 1} 
            sx={{ 
              p: 2, 
              mb: 2, 
              border: selectedPackaging === option.id ? '2px solid' : '1px solid',
              borderColor: selectedPackaging === option.id ? 'primary.main' : 'divider',
              transition: 'all 0.3s ease'
            }}
          >
            <FormControlLabel
              value={option.id}
              control={<Radio color="primary" />}
              label={
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={7}>
                    <Typography variant="subtitle1" component="div">
                      {option.name}
                      {option.additionalPrice > 0 && (
                        <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          ({formatPrice(option.additionalPrice)})
                        </Typography>
                      )}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {option.description}
                    </Typography>
                    
                    {option.carbonSaving > 0 && (
                      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                        <RecyclingIcon fontSize="small" sx={{ mr: 0.5, color: 'success.main' }} />
                        <Typography variant="body2" color="success.main">
                          Saves {option.carbonSaving}kg CO₂e
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                  
                  <Grid item xs={12} sm={5}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Environmental Impact
                      </Typography>
                      <Chip 
                        label={option.ecoImpact} 
                        size="small"
                        sx={{ 
                          backgroundColor: getImpactColor(option.ecoImpact),
                          color: 'white',
                          fontWeight: 'bold'
                        }} 
                      />
                      <Box sx={{ mt: 1, width: '100%' }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={calculateImpactPercentage(option.ecoImpact)}
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getImpactColor(option.ecoImpact)
                            }
                          }}
                        />
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              }
              sx={{ alignItems: 'flex-start', width: '100%', m: 0 }}
            />
          </Paper>
        ))}
      </RadioGroup>

      <Box mt={2} p={2} bgcolor="background.paper" borderRadius={1}>
        <Typography variant="subtitle2" gutterBottom>
          Why Choose Sustainable Packaging?
        </Typography>
        <Typography variant="body2" paragraph>
          Regular packaging accounts for about 30% of municipal solid waste in landfills. 
          By choosing eco-friendly options, you directly contribute to reducing waste and carbon emissions.
        </Typography>
        <Divider sx={{ my: 1 }} />
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="caption" color="text.secondary">
            Your packaging choices are tracked in your sustainability dashboard
          </Typography>
          <LocalShippingIcon color="action" fontSize="small" />
        </Box>
      </Box>
    </Box>
  );
};

export default SustainablePackaging;