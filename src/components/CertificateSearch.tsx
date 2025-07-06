import { useState } from 'react';
import { 
  Box, 
  TextField, 
  IconButton, 
  InputAdornment,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import { Search, Clear } from '@mui/icons-material';

interface SearchResult {
  folio: string;
  remolque: string;
  placas: string;
  fechaInicio: string;
  fechaFinal: string;
  estado: 'vigente' | 'vencido' | 'por vencer';
}

interface CertificateSearchProps {
  onSelectCertificate: (certificate: SearchResult) => void;
}

export const CertificateSearch = ({ onSelectCertificate }: CertificateSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Datos de ejemplo - en una app real vendría de una API
  const sampleCertificates: SearchResult[] = [
    {
      folio: 'CERT-2024-001',
      remolque: 'RM-12345',
      placas: 'ABC-123',
      fechaInicio: '01/01/2024',
      fechaFinal: '31/12/2024',
      estado: 'vigente'
    },
    {
      folio: 'CERT-2024-002',
      remolque: 'RM-67890',
      placas: 'DEF-456',
      fechaInicio: '15/01/2024',
      fechaFinal: '15/07/2024',
      estado: 'vencido'
    },
    {
      folio: 'CERT-2024-003',
      remolque: 'RM-11111',
      placas: 'GHI-789',
      fechaInicio: '01/06/2024',
      fechaFinal: '10/07/2024',
      estado: 'por vencer'
    }
  ];

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setIsSearching(true);

    if (term.length >= 3) {
      // Simular búsqueda con delay
      setTimeout(() => {
        const filtered = sampleCertificates.filter(cert => 
          cert.folio.toLowerCase().includes(term.toLowerCase()) ||
          cert.remolque.toLowerCase().includes(term.toLowerCase()) ||
          cert.placas.toLowerCase().includes(term.toLowerCase())
        );
        setSearchResults(filtered);
        setIsSearching(false);
      }, 300);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
  };

  const getStatusColor = (estado: string): 'success' | 'error' | 'warning' | 'default' => {
    switch (estado) {
      case 'vigente': return 'success';
      case 'vencido': return 'error';
      case 'por vencer': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <TextField
        fullWidth
        placeholder="Buscar por folio, remolque o placas..."
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
          endAdornment: searchTerm && (
            <InputAdornment position="end">
              <IconButton onClick={clearSearch} size="small">
                <Clear />
              </IconButton>
            </InputAdornment>
          )
        }}
        sx={{ mb: 2 }}
      />

      {searchResults.length > 0 && (
        <Paper elevation={2} sx={{ maxHeight: 300, overflow: 'auto' }}>
          <Typography variant="h6" sx={{ p: 2, pb: 1 }}>
            Resultados de búsqueda ({searchResults.length})
          </Typography>
          <List>
            {searchResults.map((cert) => (
              <ListItem 
                key={cert.folio}
                onClick={() => onSelectCertificate(cert)}
                sx={{ 
                  borderBottom: '1px solid #eee',
                  '&:hover': { backgroundColor: '#f5f5f5' },
                  cursor: 'pointer'
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {cert.folio}
                      </Typography>
                      <Chip 
                        label={cert.estado}
                        color={getStatusColor(cert.estado)}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2">
                        Remolque: {cert.remolque} | Placas: {cert.placas}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Vigencia: {cert.fechaInicio} - {cert.fechaFinal}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {searchTerm.length >= 3 && searchResults.length === 0 && !isSearching && (
        <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No se encontraron certificados con el término "{searchTerm}"
          </Typography>
        </Paper>
      )}
    </Box>
  );
};
