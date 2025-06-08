import React, { useEffect, useState } from 'react';
import { 
  Container, Grid, Box, Typography, Paper, 
  CircularProgress, Divider, useTheme
} from '@mui/material';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  Eco, LocalShipping, ShoppingBag, 
  Forest, EmojiEvents 
} from '@mui/icons-material';
import axios from 'axios';

const CarbonFootprintDashboard = () => {
  const theme = useTheme();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [monthlySavings, setMonthlySavings] = useState([]);
  const [categorySavings, setCategorySavings] = useState([]);
  const [badges, setBadges] = useState([]);
  const [error, setError] = useState(null);

  // Colors for charts
  const colors = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    success: '#4caf50',
    info: '#2196f3',
    warning: '#ff9800',
    error: '#f44336',
  };

  const COLORS = [colors.primary, colors.secondary, colors.success, colors.info, colors.warning];

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/users/carbon-dashboard');
        setUserData(response.data);
        
        // Process monthly savings data
        const monthlyData = response.data.carbonImpact.monthlySavings.map(item => ({
          name: `${item.month}/${item.year}`,
          savings: item.amount
        }));
        setMonthlySavings(monthlyData);
        
        // Process category savings data
        setCategorySavings(response.data.categorySavings || []);
        
        // Set badges
        setBadges(response.data.carbonImpact.badges || []);
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load dashboard data');
        setLoading(false);
        console.error('Dashboard data fetch error:', err);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Typography color="error" variant="h6">{error}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Your Sustainability Impact
      </Typography>
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column', 
              height: 140,
              borderTop: `4px solid ${colors.primary}`,
              borderRadius: '4px',
            }}
          >
            <Box display="flex" alignItems="center">
              <Eco style={{ color: colors.primary, marginRight: '8px' }} />
              <Typography variant="h6" color="textSecondary">
                Total CO₂ Saved
              </Typography>
            </Box>
            <Typography variant="h3" component="p" sx={{ mt: 2, fontWeight: 'bold' }}>
              {userData.carbonImpact.totalSaved.toFixed(2)} kg
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column', 
              height: 140,
              borderTop: `4px solid ${colors.secondary}`,
              borderRadius: '4px',
            }}
          >
            <Box display="flex" alignItems="center">
              <Forest style={{ color: colors.secondary, marginRight: '8px' }} />
              <Typography variant="h6" color="textSecondary">
                Trees Equivalent
              </Typography>
            </Box>
            <Typography variant="h3" component="p" sx={{ mt: 2, fontWeight: 'bold' }}>
              {userData.carbonImpact.treesEquivalent}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column', 
              height: 140,
              borderTop: `4px solid ${colors.success}`,
              borderRadius: '4px',
            }}
          >
            <Box display="flex" alignItems="center">
              <ShoppingBag style={{ color: colors.success, marginRight: '8px' }} />
              <Typography variant="h6" color="textSecondary">
                Eco Purchases
              </Typography>
            </Box>
            <Typography variant="h3" component="p" sx={{ mt: 2, fontWeight: 'bold' }}>
              {userData.purchaseHistory ? userData.purchaseHistory.length : 0}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column', 
              height: 140,
              borderTop: `4px solid ${colors.info}`,
              borderRadius: '4px',
            }}
          >
            <Box display="flex" alignItems="center">
              <EmojiEvents style={{ color: colors.info, marginRight: '8px' }} />
              <Typography variant="h6" color="textSecondary">
                Impact Level
              </Typography>
            </Box>
            <Typography variant="h5" component="p" sx={{ mt: 2, fontWeight: 'bold' }}>
              {userData.carbonImpact.impact || 'Just Started'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={4}>
        {/* Monthly Savings Chart */}
        <Grid item xs={12} md={8}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              borderRadius: '4px',
              height: 380 
            }}
          >
            <Typography variant="h6" gutterBottom>
              Monthly Carbon Savings
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height="85%">
              <LineChart
                data={monthlySavings}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis 
                  label={{ value: 'CO₂ Saved (kg)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value) => [`${value} kg CO₂`, 'Carbon Saved']}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="savings" 
                  stroke={colors.primary} 
                  activeDot={{ r: 8 }} 
                  strokeWidth={2}
                  name="Carbon Saved"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Category Savings Pie Chart */}
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              borderRadius: '4px',
              height: 380 
            }}
          >
            <Typography variant="h6" gutterBottom>
              Savings by Category
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie
                  data={categorySavings}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {categorySavings.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} kg CO₂`, 'Carbon Saved']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Badges Section */}
      <Box mt={4}>
        <Typography variant="h5" gutterBottom>
          Your Sustainability Badges
        </Typography>
        <Grid container spacing={3}>
          {badges.length > 0 ? (
            badges.map((badge, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Paper 
                  elevation={2} 
                  sx={{ 
                    p: 2, 
                    display: 'flex', 
                    alignItems: 'center',
                    borderLeft: `4px solid ${COLORS[index % COLORS.length]}`,
                  }}
                >
                  <EmojiEvents 
                    style={{ 
                      fontSize: 40, 
                      marginRight: 16, 
                      color: COLORS[index % COLORS.length] 
                    }} 
                  />
                  <Box>
                    <Typography variant="h6">{badge.name}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {badge.description}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Earned on {new Date(badge.earnedAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography>
                  Make eco-friendly purchases to earn sustainability badges!
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>
      
      {/* Environmental Tips Section */}
      <Box mt={4} mb={4}>
        <Typography variant="h5" gutterBottom>
          Tips to Improve Your Impact
        </Typography>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="flex-start">
                <LocalShipping style={{ marginRight: 1, color: colors.primary }} />
                <Box>
                  <Typography variant="h6">Consolidate Orders</Typography>
                  <Typography variant="body2">
                    Try group buying with friends to reduce shipping emissions by up to 30%.
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="flex-start">
                <Eco style={{ marginRight: 1, color: colors.success }} />
                <Box>
                  <Typography variant="h6">Choose 4+ Eco-Score</Typography>
                  <Typography variant="body2">
                    Products with an eco-score of 4 or higher reduce your carbon footprint by at least 40%.
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="flex-start">
                <ShoppingBag style={{ marginRight: 1, color: colors.secondary }} />
                <Box>
                  <Typography variant="h6">Sustainable Packaging</Typography>
                  <Typography variant="body2">
                    Selecting eco-friendly packaging options can save up to 2.5kg CO₂ per order.
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
};

export default CarbonFootprintDashboard;