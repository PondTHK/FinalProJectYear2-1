"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Paper,
  Stack,
} from "@mui/material";
import {
  getPrivacySettings,
  savePrivacySettings,
  resetPrivacySettings,
  type PrivacySettings,
  DEFAULT_PRIVACY_SETTINGS,
} from "@/app/lib/privacy-settings";

interface PrivacySettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function PrivacySettingsDialog({
  open,
  onClose,
}: PrivacySettingsDialogProps) {
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS);

  useEffect(() => {
    const loadSettings = async () => {
      if (open) {
        const loadedSettings = await getPrivacySettings();
        setSettings(loadedSettings);
      }
    };

    loadSettings();
  }, [open]);

  const handleToggle = (field: keyof PrivacySettings) => {
    setSettings((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSave = async () => {
    try {
      await savePrivacySettings(settings);
      // Reload settings from API to ensure sync
      const reloadedSettings = await getPrivacySettings();
      setSettings(reloadedSettings);
    } catch (error) {
      console.error("Failed to save privacy settings:", error);
      // Show error message to user
      alert("ไม่สามารถบันทึกการตั้งค่าได้ กรุณาลองใหม่อีกครั้ง");
      return;
    }
    onClose();
  };

  const handleReset = () => {
    setSettings(DEFAULT_PRIVACY_SETTINGS);
    resetPrivacySettings();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight={700}>
          การตั้งค่าโปรไฟล์สาธารณะ
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          กำหนดว่าข้อมูลใดบ้างที่ผู้อื่นสามารถเห็นได้
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {/* Profile Section */}
          <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50" }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              ข้อมูลโปรไฟล์
            </Typography>
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showProfile}
                    onChange={() => handleToggle("showProfile")}
                  />
                }
                label="เปิดใช้งานโปรไฟล์สาธารณะ"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showProfileImage}
                    onChange={() => handleToggle("showProfileImage")}
                    disabled={!settings.showProfile}
                  />
                }
                label="แสดงรูปโปรไฟล์"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showCoverImage}
                    onChange={() => handleToggle("showCoverImage")}
                    disabled={!settings.showProfile}
                  />
                }
                label="แสดงรูปปก"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showName}
                    onChange={() => handleToggle("showName")}
                    disabled={!settings.showProfile}
                  />
                }
                label="แสดงชื่อ"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showTitle}
                    onChange={() => handleToggle("showTitle")}
                    disabled={!settings.showProfile}
                  />
                }
                label="แสดงตำแหน่งงาน"
              />
            </Stack>
          </Paper>

          {/* Contact Information */}
          <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50" }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              ข้อมูลติดต่อ
            </Typography>
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showPhone}
                    onChange={() => handleToggle("showPhone")}
                    disabled={!settings.showProfile}
                  />
                }
                label="แสดงเบอร์โทรศัพท์"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showEmail}
                    onChange={() => handleToggle("showEmail")}
                    disabled={!settings.showProfile}
                  />
                }
                label="แสดง Email"
              />
            </Stack>
          </Paper>

          {/* Personal Information */}
          <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50" }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              ข้อมูลส่วนตัว
            </Typography>
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showGender}
                    onChange={() => handleToggle("showGender")}
                    disabled={!settings.showProfile}
                  />
                }
                label="แสดงเพศ"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showBirthDate}
                    onChange={() => handleToggle("showBirthDate")}
                    disabled={!settings.showProfile}
                  />
                }
                label="แสดงวันเกิด"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showNationality}
                    onChange={() => handleToggle("showNationality")}
                    disabled={!settings.showProfile}
                  />
                }
                label="แสดงสัญชาติ"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showAddress}
                    onChange={() => handleToggle("showAddress")}
                    disabled={!settings.showProfile}
                  />
                }
                label="แสดงที่อยู่"
              />
            </Stack>
          </Paper>

          {/* Professional Information */}
          <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50" }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              ข้อมูลอาชีพ
            </Typography>
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showExperiences}
                    onChange={() => handleToggle("showExperiences")}
                    disabled={!settings.showProfile}
                  />
                }
                label="แสดงประสบการณ์ทำงาน"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showEducations}
                    onChange={() => handleToggle("showEducations")}
                    disabled={!settings.showProfile}
                  />
                }
                label="แสดงประวัติการศึกษา"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showJobPreference}
                    onChange={() => handleToggle("showJobPreference")}
                    disabled={!settings.showProfile}
                  />
                }
                label="แสดงตำแหน่งที่สนใจ"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showPortfolios}
                    onChange={() => handleToggle("showPortfolios")}
                    disabled={!settings.showProfile}
                  />
                }
                label="แสดงผลงาน (My Works)"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showSkills}
                    onChange={() => handleToggle("showSkills")}
                    disabled={!settings.showProfile}
                  />
                }
                label="แสดงทักษะ"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showAboutMe}
                    onChange={() => handleToggle("showAboutMe")}
                    disabled={!settings.showProfile}
                  />
                }
                label="แสดงเกี่ยวกับฉัน"
              />
            </Stack>
          </Paper>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleReset} color="error">
          รีเซ็ตเป็นค่าเริ่มต้น
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose}>ยกเลิก</Button>
        <Button onClick={handleSave} variant="contained">
          บันทึก
        </Button>
      </DialogActions>
    </Dialog>
  );
}

