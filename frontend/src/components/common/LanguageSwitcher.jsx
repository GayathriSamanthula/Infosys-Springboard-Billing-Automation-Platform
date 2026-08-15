import React, { useContext } from 'react';
import { Select, MenuItem, FormControl, Box, Typography } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import { LanguageScopeContext } from '../../context/LanguageContext';
import { SUPPORTED_LANGUAGES } from '../../i18n';

export default function LanguageSwitcher({ size = 'small', color = 'default' }) {
  const { currentLang, changeLanguage } = useContext(LanguageScopeContext);

  return (
    <FormControl size={size} variant="outlined">
      <Select
        value={currentLang || 'en'}
        onChange={(e) => changeLanguage(e.target.value)}
        displayEmpty
        renderValue={(selected) => {
          const lang = SUPPORTED_LANGUAGES.find((l) => l.code === selected);
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LanguageIcon fontSize="small" sx={{ color: color === 'light' ? '#fff' : 'inherit' }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: color === 'light' ? '#fff' : 'inherit' }}>
                {lang ? lang.name : 'English'}
              </Typography>
            </Box>
          );
        }}
        sx={{
          borderRadius: 2,
          backgroundColor: color === 'light' ? 'rgba(255, 255, 255, 0.15)' : 'background.paper',
          color: color === 'light' ? '#fff' : 'inherit',
          '.MuiSelect-select': { py: 0.75, px: 1.5 },
          '.MuiOutlinedInput-notchedOutline': {
            borderColor: color === 'light' ? 'rgba(255, 255, 255, 0.3)' : undefined
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: color === 'light' ? 'rgba(255, 255, 255, 0.6)' : undefined
          }
        }}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <MenuItem key={lang.code} value={lang.code} sx={{ py: 1, fontSize: '0.9rem' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <span>{lang.name}</span>
              {lang.dir === 'rtl' && (
                <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1, px: 0.8, py: 0.2, bgcolor: 'action.selected', borderRadius: 1 }}>
                  RTL
                </Typography>
              )}
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
