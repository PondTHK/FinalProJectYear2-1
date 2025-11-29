/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Box,
  TextField,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Paper,
  Stack,
  IconButton,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import ImageIcon from '@mui/icons-material/Image';
import { storageAPI, userAPI, type UserPortfolioResponse } from '@/app/lib/api';

const textFieldSlotProps = {
  input: {
    sx: {
      color: '#11121f',
      '&::placeholder': {
        color: '#5c678f',
        opacity: 1,
      },
    },
  },
} as const;

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  link: string;
}

const initialPortfolioForm: Omit<PortfolioItem, 'id'> = {
  title: '',
  description: '',
  imageUrl: null,
  link: '',
};

type StatusState =
  | {
    type: 'success' | 'error';
    message: string;
  }
  | null;

export default function OtherTab() {
  const t = useTranslations('Onboarding.other');
  const [portfolioItems, setPortfolioItems] = useState<UserPortfolioResponse[]>([]);
  const [portfolioForm, setPortfolioForm] = useState<Omit<PortfolioItem, 'id'>>(initialPortfolioForm);
  const [portfolioEditingId, setPortfolioEditingId] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isFetchingPortfolios, setIsFetchingPortfolios] = useState(false);
  const [isSavingPortfolio, setIsSavingPortfolio] = useState(false);
  const [status, setStatus] = useState<StatusState>(null);
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [languages, setLanguages] = useState({
    thai: true,
    english: false,
    chinese: false,
  });
  const [additionalInfo, setAdditionalInfo] = useState('');

  // Load data from API and localStorage on mount
  const fetchPortfolios = async () => {
    setIsFetchingPortfolios(true);
    try {
      const response = await userAPI.getPortfolios();
      if (response.ok && response.data) {
        setPortfolioItems(response.data);
      } else if (response.status !== 404) {
        const message =
          typeof response.data === 'string'
            ? response.data
            : t('alerts.fetchError');
        setStatus({
          type: 'error',
          message,
        });
      }
    } catch (error) {
      console.error('Failed to fetch portfolios', error);
      setStatus({
        type: 'error',
        message: t('alerts.loadError'),
      });
    } finally {
      setIsFetchingPortfolios(false);
    }
  };

  useEffect(() => {
    fetchPortfolios();

    // Load other data from localStorage
    if (typeof window !== 'undefined') {
      const savedGithub = localStorage.getItem('user_github');
      const savedLinkedin = localStorage.getItem('user_linkedin');
      const savedPortfolioLink = localStorage.getItem('user_portfolio_link');
      const savedLanguages = localStorage.getItem('user_languages');
      const savedAdditionalInfo = localStorage.getItem('user_additional_info');

      if (savedGithub) setGithub(savedGithub);
      if (savedLinkedin) setLinkedin(savedLinkedin);
      if (savedPortfolioLink) setPortfolioLink(savedPortfolioLink);
      if (savedLanguages) {
        try {
          setLanguages(JSON.parse(savedLanguages));
        } catch (e) {
          console.error('Failed to parse languages', e);
        }
      }
      if (savedAdditionalInfo) setAdditionalInfo(savedAdditionalInfo);
    }
  }, []);

  const resetStatus = () => {
    setStatus(null);
  };

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setStatus({
        type: 'error',
        message: t('alerts.selectImage'),
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setStatus({
        type: 'error',
        message: t('alerts.fileSize'),
      });
      return;
    }

    setIsUploadingImage(true);
    resetStatus();

    try {
      const response = await storageAPI.uploadFile(file, 'portfolio');
      if (response.ok && response.data.url) {
        setPortfolioForm({ ...portfolioForm, imageUrl: response.data.url });
        setStatus({
          type: 'success',
          message: t('alerts.uploadSuccess'),
        });
      } else {
        const errorMessage =
          (response.data as any)?.error ||
          response.data?.message ||
          t('alerts.uploadError');
        setStatus({
          type: 'error',
          message: errorMessage,
        });
      }
    } catch (err) {
      console.error('Image upload error:', err);
      setStatus({
        type: 'error',
        message: t('alerts.uploadException'),
      });
    } finally {
      setIsUploadingImage(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleAddPortfolio = async () => {
    resetStatus();
    if (!portfolioForm.title.trim()) {
      setStatus({
        type: 'error',
        message: t('alerts.enterTitle'),
      });
      return;
    }

    setIsSavingPortfolio(true);
    try {
      const payload = {
        title: portfolioForm.title.trim(),
        description: portfolioForm.description.trim() || null,
        image_url: portfolioForm.imageUrl || null,
        link: portfolioForm.link.trim() || null,
      };

      const response = await userAPI.createPortfolio(payload);

      if (!response.ok) {
        const message =
          typeof response.data === 'string'
            ? response.data
            : t('alerts.saveError');
        throw new Error(message);
      }

      if (response.data) {
        await fetchPortfolios();
        setPortfolioForm(initialPortfolioForm);
        setStatus({
          type: 'success',
          message: t('alerts.addSuccess'),
        });
      }
    } catch (error) {
      console.error('Failed to save portfolio', error);
      const message =
        error instanceof Error
          ? error.message
          : t('alerts.saveException');
      setStatus({ type: 'error', message });
    } finally {
      setIsSavingPortfolio(false);
    }
  };

  const handleEditPortfolio = (id: string) => {
    const item = portfolioItems.find((p) => p.id === id);
    if (item) {
      setPortfolioForm({
        title: item.title,
        description: item.description || '',
        imageUrl: item.image_url || null,
        link: item.link || '',
      });
      setPortfolioEditingId(id);
    }
  };

  const handleUpdatePortfolio = async () => {
    resetStatus();
    if (!portfolioForm.title.trim()) {
      setStatus({
        type: 'error',
        message: t('alerts.enterTitle'),
      });
      return;
    }

    if (!portfolioEditingId) return;

    setIsSavingPortfolio(true);
    try {
      const payload = {
        title: portfolioForm.title.trim(),
        description: portfolioForm.description.trim() || null,
        image_url: portfolioForm.imageUrl || null,
        link: portfolioForm.link.trim() || null,
      };

      const response = await userAPI.updatePortfolio(portfolioEditingId, payload);

      if (!response.ok) {
        const message =
          typeof response.data === 'string'
            ? response.data
            : t('alerts.updateError');
        throw new Error(message);
      }

      if (response.data) {
        await fetchPortfolios();
        setPortfolioForm(initialPortfolioForm);
        setPortfolioEditingId(null);
        setStatus({
          type: 'success',
          message: t('alerts.updateSuccess'),
        });
      }
    } catch (error) {
      console.error('Failed to update portfolio', error);
      const message =
        error instanceof Error
          ? error.message
          : t('alerts.updateException');
      setStatus({ type: 'error', message });
    } finally {
      setIsSavingPortfolio(false);
    }
  };

  const handleDeletePortfolio = async (id: string) => {
    resetStatus();
    try {
      const response = await userAPI.deletePortfolio(id);

      if (!response.ok) {
        const message =
          typeof response.data === 'string'
            ? response.data
            : t('alerts.deleteError');
        throw new Error(message);
      }

      await fetchPortfolios();
      setStatus({
        type: 'success',
        message: t('alerts.deleteSuccess'),
      });
    } catch (error) {
      console.error('Failed to delete portfolio', error);
      const message =
        error instanceof Error
          ? error.message
          : t('alerts.deleteException');
      setStatus({ type: 'error', message });
    }
  };

  const handleCancelEdit = () => {
    setPortfolioForm(initialPortfolioForm);
    setPortfolioEditingId(null);
  };

  const handleSaveLinks = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_github', github);
      localStorage.setItem('user_linkedin', linkedin);
      localStorage.setItem('user_portfolio_link', portfolioLink);
      localStorage.setItem('user_languages', JSON.stringify(languages));
      localStorage.setItem('user_additional_info', additionalInfo);
      setStatus({
        type: 'success',
        message: t('alerts.saveDataSuccess'),
      });
    }
  };

  return (
    <Box>
      <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#222752', mb: 2 }}>
        {t('title')}
      </Typography>

      {status && (
        <Alert
          severity={status.type}
          sx={{ mb: 2 }}
          onClose={resetStatus}
        >
          {status.message}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Portfolio Section */}
        <Grid size={12}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: '#f8f9fa',
              border: '1px solid #e9ecef',
            }}
          >
            <Typography sx={{ fontWeight: 600, color: '#30375f', mb: 2 }}>
              {t('portfolio.title')}
            </Typography>

            {/* Portfolio Form */}
            <Box sx={{ mb: 3 }}>
              <TextField
                label={t('portfolio.form.title')}
                fullWidth
                value={portfolioForm.title}
                onChange={(e) =>
                  setPortfolioForm({ ...portfolioForm, title: e.target.value })
                }
                slotProps={textFieldSlotProps}
                sx={{ mb: 2 }}
              />
              <TextField
                label={t('portfolio.form.description')}
                multiline
                rows={3}
                fullWidth
                value={portfolioForm.description}
                onChange={(e) =>
                  setPortfolioForm({
                    ...portfolioForm,
                    description: e.target.value,
                  })
                }
                slotProps={textFieldSlotProps}
                sx={{ mb: 2 }}
              />
              <TextField
                label={t('portfolio.form.linkUrl')}
                fullWidth
                value={portfolioForm.link}
                onChange={(e) =>
                  setPortfolioForm({ ...portfolioForm, link: e.target.value })
                }
                slotProps={textFieldSlotProps}
                sx={{ mb: 2 }}
                placeholder="https://example.com"
              />

              {/* Image Upload */}
              <Box sx={{ mb: 2 }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="portfolio-image-upload"
                  type="file"
                  onChange={handleImageSelect}
                  disabled={isUploadingImage}
                />
                <label htmlFor="portfolio-image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<ImageIcon />}
                    disabled={isUploadingImage}
                    sx={{ mb: 1 }}
                  >
                    {isUploadingImage ? (
                      <>
                        <CircularProgress size={16} sx={{ mr: 1 }} />
                        {t('portfolio.form.uploading')}
                      </>
                    ) : portfolioForm.imageUrl ? (
                      t('portfolio.form.changeImage')
                    ) : (
                      t('portfolio.form.uploadImage')
                    )}
                  </Button>
                </label>
                {portfolioForm.imageUrl && (
                  <Box
                    sx={{
                      mt: 1,
                      position: 'relative',
                      display: 'inline-block',
                    }}
                  >
                    <img
                      src={portfolioForm.imageUrl}
                      alt="Portfolio preview"
                      style={{
                        maxWidth: '200px',
                        maxHeight: '200px',
                        borderRadius: '8px',
                        objectFit: 'cover',
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() =>
                        setPortfolioForm({ ...portfolioForm, imageUrl: null })
                      }
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        bgcolor: 'error.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'error.dark' },
                      }}
                    >
                      <DeleteRoundedIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>

              <Stack direction="row" spacing={2}>
                {portfolioEditingId ? (
                  <>
                    <Button
                      variant="contained"
                      onClick={handleUpdatePortfolio}
                      startIcon={<EditRoundedIcon />}
                      disabled={isSavingPortfolio}
                    >
                      {isSavingPortfolio ? t('portfolio.form.saving') : t('portfolio.form.saveChanges')}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleCancelEdit}
                      disabled={isSavingPortfolio}
                    >
                      {t('portfolio.form.cancel')}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleAddPortfolio}
                    startIcon={<AddRoundedIcon />}
                    disabled={isSavingPortfolio}
                  >
                    {isSavingPortfolio ? t('portfolio.form.saving') : t('portfolio.form.add')}
                  </Button>
                )}
              </Stack>
            </Box>

            {/* Portfolio List */}
            {isFetchingPortfolios ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : portfolioItems.length > 0 ? (
              <Box>
                <Typography
                  sx={{ fontWeight: 600, color: '#30375f', mb: 2 }}
                >
                  {t('portfolio.listTitle')} ({portfolioItems.length})
                </Typography>
                <Stack spacing={2}>
                  {portfolioItems.map((item) => (
                    <Paper
                      key={item.id}
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'white',
                        border: '1px solid #e9ecef',
                        display: 'flex',
                        gap: 2,
                      }}
                    >
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          style={{
                            width: '100px',
                            height: '100px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                          }}
                        />
                      )}
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          sx={{ fontWeight: 600, color: '#30375f', mb: 0.5 }}
                        >
                          {item.title}
                        </Typography>
                        {item.description && (
                          <Typography
                            variant="body2"
                            sx={{ color: '#6c757d', mb: 1 }}
                          >
                            {item.description}
                          </Typography>
                        )}
                        {item.link && (
                          <Typography
                            variant="caption"
                            component="a"
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              color: '#6366f1',
                              textDecoration: 'none',
                              '&:hover': { textDecoration: 'underline' },
                            }}
                          >
                            {item.link}
                          </Typography>
                        )}
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          onClick={() => handleEditPortfolio(item.id)}
                          sx={{ color: '#6366f1' }}
                        >
                          <EditRoundedIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeletePortfolio(item.id)}
                          sx={{ color: '#ef4444' }}
                        >
                          <DeleteRoundedIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            ) : null}
          </Paper>
        </Grid>

        {/* Links Section */}
        <Grid size={12}>
          <TextField
            label={t('links.portfolio')}
            fullWidth
            value={portfolioLink}
            onChange={(e) => setPortfolioLink(e.target.value)}
            slotProps={textFieldSlotProps}
          />
        </Grid>
        <Grid size={12}>
          <TextField
            label={t('links.github')}
            fullWidth
            value={github}
            onChange={(e) => setGithub(e.target.value)}
            slotProps={textFieldSlotProps}
          />
        </Grid>
        <Grid size={12}>
          <TextField
            label={t('links.linkedin')}
            fullWidth
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            slotProps={textFieldSlotProps}
          />
        </Grid>

        {/* Languages */}
        <Grid size={12}>
          <Typography sx={{ fontWeight: 600, color: '#30375f', mb: 1 }}>
            {t('languages.title')}
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={languages.thai}
                  onChange={(e) =>
                    setLanguages({ ...languages, thai: e.target.checked })
                  }
                />
              }
              label={t('languages.thai')}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={languages.english}
                  onChange={(e) =>
                    setLanguages({ ...languages, english: e.target.checked })
                  }
                />
              }
              label={t('languages.english')}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={languages.chinese}
                  onChange={(e) =>
                    setLanguages({ ...languages, chinese: e.target.checked })
                  }
                />
              }
              label={t('languages.chinese')}
            />
          </FormGroup>
        </Grid>

        {/* Additional Info */}
        <Grid size={12}>
          <TextField
            label={t('additionalInfo')}
            multiline
            rows={4}
            fullWidth
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            slotProps={textFieldSlotProps}
          />
        </Grid>

        {/* Save Button */}
        <Grid size={12}>
          <Button
            variant="contained"
            fullWidth
            onClick={handleSaveLinks}
            sx={{ py: 1.5 }}
          >
            {t('save')}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
