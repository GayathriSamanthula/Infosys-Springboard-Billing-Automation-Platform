import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TextField,
  InputAdornment,
  Box,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EmptyState from './EmptyState';
import { TableSkeleton } from './LoadingSkeleton';
import { useTranslation } from 'react-i18next';

const DataTable = ({
  columns,
  data = [],
  loading = false,
  searchPlaceholder = 'Search records...',
  filterField,
  filterOptions = [],
  filterLabel = 'Status',
  emptyTitle,
  emptyDescription,
  onAddClick,
  addLabel,
}) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('ALL');

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const handleFilterChange = (e) => {
    setFilterValue(e.target.value);
    setPage(0);
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (filterField && filterValue !== 'ALL') {
        const itemVal = String(item[filterField] || '').toLowerCase();
        if (itemVal !== String(filterValue).toLowerCase()) {
          return false;
        }
      }
      if (!searchTerm) return true;
      const lowerSearch = searchTerm.toLowerCase();
      return Object.values(item).some((val) => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'object') {
          return JSON.stringify(val).toLowerCase().includes(lowerSearch);
        }
        return String(val).toLowerCase().includes(lowerSearch);
      });
    });
  }, [data, searchTerm, filterField, filterValue]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedData = useMemo(() => {
    return filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  return (
    <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden', border: '2px solid #0284c7', borderRadius: 3, bgcolor: '#FFFFFF !important', background: '#FFFFFF !important' }}>
      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FFFFFF !important',
          background: '#FFFFFF !important',
          borderBottom: '2px solid #E5E7EB',
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, flex: 1, minWidth: 280, maxWidth: 500 }}>
          <TextField
            size="small"
            placeholder={t('admin.table.search_placeholder', searchPlaceholder)}
            value={searchTerm}
            onChange={handleSearchChange}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#0284c7' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              backgroundColor: '#FFFFFF',
              borderRadius: 1,
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#D1D5DB' },
                '&:hover fieldset': { borderColor: '#0284c7' },
                '&.Mui-focused fieldset': { borderColor: '#0284c7' },
              },
            }}
          />

          {filterField && filterOptions.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel sx={{ color: '#4B5563' }}>{t('admin.table.filter_label', filterLabel)}</InputLabel>
              <Select
                value={filterValue}
                label={filterLabel}
                onChange={handleFilterChange}
                sx={{
                  backgroundColor: '#FFFFFF',
                  color: '#111827',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#D1D5DB' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#0284c7' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0284c7' },
                }}
              >
                <MenuItem value="ALL">{t('admin.table.all_statuses', 'All Statuses')}</MenuItem>
                {filterOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {t(`status.${String(opt.value).toLowerCase()}`, opt.label)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </Box>

      <TableContainer sx={{ bgcolor: '#FFFFFF !important', background: '#FFFFFF !important' }}>
        {loading ? (
          <Box sx={{ p: 2, bgcolor: '#FFFFFF !important' }}>
            <TableSkeleton rows={rowsPerPage > 5 ? 5 : rowsPerPage} columns={columns.length} />
          </Box>
        ) : paginatedData.length === 0 ? (
          <EmptyState
            title={emptyTitle || 'No matching data'}
            description={emptyDescription || 'Try adjusting your search query or status filters.'}
            actionLabel={addLabel}
            onAction={onAddClick}
          />
        ) : (
          <Table sx={{ minWidth: 650, bgcolor: '#FFFFFF !important' }}>
            <TableHead sx={{ bgcolor: '#FFFFFF !important', background: '#FFFFFF !important' }}>
              {/* Pure White Header Row & Cells */}
              <TableRow sx={{ bgcolor: '#FFFFFF !important', background: '#FFFFFF !important', borderBottom: '2px solid #E5E7EB' }}>
                {columns.map((col) => (
                  <TableCell
                    key={col.id}
                    align={col.align || 'left'}
                    style={{ width: col.width }}
                    sx={{ color: '#0284c7', fontWeight: 900, bgcolor: '#FFFFFF !important', background: '#FFFFFF !important' }}
                  >
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody sx={{ bgcolor: '#FFFFFF !important' }}>
              {paginatedData.map((row, rIndex) => (
                <TableRow
                  hover
                  key={row.id || rIndex}
                  sx={{
                    bgcolor: '#FFFFFF !important',
                    '&:hover': { bgcolor: 'rgba(2, 132, 199, 0.05) !important' },
                  }}
                >
                  {columns.map((col) => (
                    <TableCell key={col.id} align={col.align || 'left'} sx={{ color: '#111827', bgcolor: '#FFFFFF !important' }}>
                      {col.render ? col.render(row) : row[col.id]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {!loading && filteredData.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: '1px solid #E5E7EB', color: '#4B5563', bgcolor: '#FFFFFF !important' }}
        />
      )}
    </Paper>
  );
};

export default DataTable;
