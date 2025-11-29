use anyhow::{Context, Result};
use lettre::{
    message::{header::ContentType, Mailbox, Message, MultiPart, SinglePart},
    transport::smtp::authentication::Credentials,
    AsyncSmtpTransport, AsyncTransport, Message as LettreMessage, Tokio1Executor,
};
use std::sync::Arc;
use tracing::{error, info};

#[derive(Debug, Clone)]
pub struct EmailService {
    smtp_host: String,
    smtp_port: u16,
    smtp_username: String,
    smtp_password: String,
    from_email: String,
    from_name: String,
}

impl EmailService {
    pub fn new() -> Result<Self> {
        // Gmail SMTP configuration
        let smtp_host = std::env::var("SMTP_HOST")
            .unwrap_or_else(|_| "smtp.gmail.com".to_string());
        
        let smtp_port = std::env::var("SMTP_PORT")
            .unwrap_or_else(|_| "587".to_string())
            .parse::<u16>()
            .context("SMTP_PORT must be a valid number (587 for TLS, 465 for SSL)")?;
        
        let smtp_username = std::env::var("SMTP_USERNAME")
            .context("SMTP_USERNAME must be set (your Gmail address)")?;
        
        let smtp_password = std::env::var("SMTP_PASSWORD")
            .context("SMTP_PASSWORD must be set (Gmail App Password, not regular password)")?;

        let from_email = std::env::var("EMAIL_FROM")
            .unwrap_or_else(|_| smtp_username.clone());

        let from_name = std::env::var("EMAIL_FROM_NAME")
            .unwrap_or_else(|_| "Smart Persona".to_string());

        info!(
            "Email service initialized (Gmail SMTP) - From: {} <{}>, Host: {}:{}",
            from_name, from_email, smtp_host, smtp_port
        );

        Ok(Self {
            smtp_host,
            smtp_port,
            smtp_username,
            smtp_password,
            from_email,
            from_name,
        })
    }

    /// Check if email service is properly configured
    pub fn is_configured(&self) -> bool {
        !self.smtp_username.is_empty() && !self.smtp_password.is_empty()
    }

    /// Create a dummy email service (for when email service is not configured)
    pub fn dummy() -> Self {
        Self {
            smtp_host: String::new(),
            smtp_port: 587,
            smtp_username: String::new(),
            smtp_password: String::new(),
            from_email: String::new(),
            from_name: String::new(),
        }
    }

    pub async fn send_email(
        &self,
        to: &str,
        subject: &str,
        html_body: &str,
    ) -> Result<()> {
        // Parse email addresses
        let from_mailbox: Mailbox = format!("{} <{}>", self.from_name, self.from_email)
            .parse()
            .context("Invalid from email address")?;

        let to_mailbox: Mailbox = to
            .parse()
            .context("Invalid to email address")?;

        info!("Sending email - From: {} <{}>, To: {}, Subject: {}", 
            self.from_name, self.from_email, to, subject);

        // Create email message with HTML content
        let email = Message::builder()
            .from(from_mailbox.clone())
            .to(to_mailbox)
            .subject(subject)
            .multipart(
                MultiPart::alternative()
                    .singlepart(
                        SinglePart::builder()
                            .header(ContentType::TEXT_HTML)
                            .body(html_body.to_string()),
                    )
            )
            .context("Failed to build email message")?;

        // Create SMTP transport
        let creds = Credentials::new(self.smtp_username.clone(), self.smtp_password.clone());
        
        let mailer = if self.smtp_port == 465 {
            // SSL
            AsyncSmtpTransport::<Tokio1Executor>::relay(&self.smtp_host)
                .context("Failed to create SMTP relay")?
                .port(self.smtp_port)
                .credentials(creds)
                .build()
        } else {
            // TLS (default for Gmail port 587)
            AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(&self.smtp_host)
                .context("Failed to create SMTP relay")?
                .port(self.smtp_port)
                .credentials(creds)
                .build()
        };

        // Send email
        match mailer.send(email).await {
            Ok(_) => {
                info!("Email sent successfully to {}", to);
            Ok(())
            }
            Err(e) => {
                error!("Failed to send email: {}", e);
                anyhow::bail!("Failed to send email: {}", e);
            }
        }
    }

    pub async fn send_company_registration_email(
        &self,
        company_email: &str,
        company_name: &str,
    ) -> Result<()> {
        let subject = "ขอบคุณที่ลงทะเบียนบริษัทกับเรา - Smart Persona";
        
        // Get frontend URL from environment or use default
        let frontend_url = std::env::var("FRONTEND_URL")
            .unwrap_or_else(|_| "https://smartpersona.com".to_string());
        let approval_url = format!("{}/company-pending-approval", frontend_url);
        
        let html_body = format!(
            r#"<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="th">
<head>
    <title></title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <style>
        table, td, div, h1, p {{ font-family: Arial, sans-serif; }}
        img {{ border: 0; }}
    </style>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;">
    <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;background:#ffffff;">
        <tr>
            <td align="center" style="padding:0;">
                <!-- กล่องหลัก -->
                <table role="presentation" style="background-color:#101746;width:602px;border-collapse:collapse;text-align:left;border:10px;">
                    <tr>
                        <td style="padding:0 0 20px 0;">
                            <img src="https://4cc70d890c.imgdist.com/public/users/Integrators/BeeProAgency/1138861_1121947/Screenshot%202024-12-12%20at%206.46.52%E2%80%AFPM.png"
                                width="200" alt="Smart Persona" style="display:block;margin:20px auto 0 auto;">
                        </td>
                    </tr>
                    <!-- หัวข้อ -->
                    <tr>
                        <td>
                            <table width="100%" style="padding:0;">
                                <tr>
                                    <td style="padding:10px;">
                                        <h1 style="margin:0;text-align:center;font-size:22px;line-height:1.5;color:#ffffff;">
                                            ขอบคุณที่ลงทะเบียนบริษัทกับเรา
                                        </h1>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- เนื้อหาหลัก -->
                    <tr>
                        <td>
                            <table width="100%">
                                <tr>
                                    <td style="padding:25px;">
                                        <p style="color:#ffffff;text-align:center;font-size:16px;line-height:1.8;margin:0;">
                                            สวัสดี <strong>{}</strong>,<br><br>
                                            เราได้รับข้อมูลการลงทะเบียนของคุณเรียบร้อยแล้ว<br><br>
                                            ขณะนี้ข้อมูลของคุณกำลังอยู่ในขั้นตอน<br>
                                            <strong>รอการตรวจสอบและอนุมัติจากผู้ดูแลระบบ (Admin)</strong><br><br>
                                            เมื่อการอนุมัติสำเร็จ คุณจะได้รับอีเมลแจ้งเตือนโดยอัตโนมัติ
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:0 25px 25px 25px;">
                                        <p style="color:#ffffff;font-size:16px;line-height:1.8;text-align:center;margin:0;">
                                            หากต้องการสอบถามข้อมูลเพิ่มเติม<br>
                                            ทีมงานของเรายินดีให้ความช่วยเหลือตลอดเวลา<br><br>
                                            ขอบคุณที่ไว้วางใจใช้บริการของเรา
                                        </p>
                                    </td>
                                </tr>
                                <!-- ปุ่ม -->
                                <tr>
                                    <td align="center" style="padding:10px 0 30px 0;">
                                        <a href="{}" style="background-color:#ffffff;color:#101746;padding:12px 20px;border-radius:5px;text-decoration:none;font-weight:bold;display:inline-block;">
                                            ตรวจสอบสถานะการอนุมัติ
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
                <!-- Footer -->
                <table role="presentation" style="width:602px;background:#303030;border-collapse:collapse;">
                    <tr>
                        <td style="padding:20px;text-align:center;color:#ffffff;">
                            <p style="margin:0;font-size:24px;letter-spacing:2px;">SMART PERSONA</p>
                            <p style="margin:10px 0 0 0;font-size:14px;">
                                ขอบคุณที่ลงทะเบียนบริษัทกับเรา<br>
                                ทางเราจะรีบดำเนินการตรวจสอบข้อมูลของคุณโดยเร็วที่สุด
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>"#,
            company_name,
            approval_url
        );

        self.send_email(company_email, subject, &html_body).await
    }

    pub async fn send_company_approval_email(
        &self,
        company_email: &str,
        company_name: &str,
    ) -> Result<()> {
        let subject = "ยินดีด้วย! บริษัทของคุณได้รับการอนุมัติแล้ว - Smart Persona";
        let html_body = format!(
            r#"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ display: inline-block; padding: 12px 30px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 ยินดีด้วย!</h1>
                    </div>
                    <div class="content">
                        <h2>บริษัทของคุณได้รับการอนุมัติแล้ว</h2>
                        <p>สวัสดี <strong>{}</strong>,</p>
                        <p>เรามีข่าวดี! บริษัทของคุณได้รับการอนุมัติแล้ว</p>
                        <p>ตอนนี้คุณสามารถเข้าสู่ระบบและเริ่มใช้งาน Smart Persona ได้ทันที</p>
                        <a href="https://smartpersona.com/company-login" class="button">เข้าสู่ระบบ</a>
                        <p>คุณสามารถ:</p>
                        <ul>
                            <li>สร้างและจัดการประกาศรับสมัครงาน</li>
                            <li>ค้นหาและติดต่อผู้สมัครที่มีคุณสมบัติเหมาะสม</li>
                            <li>จัดการโปรไฟล์บริษัทของคุณ</li>
                        </ul>
                        <p>หากมีคำถามใดๆ กรุณาติดต่อเราที่ support@smartpersona.com</p>
                        <p>ขอให้ประสบความสำเร็จ!<br>ทีมงาน Smart Persona</p>
                    </div>
                    <div class="footer">
                        <p>อีเมลนี้ส่งโดยอัตโนมัติ กรุณาอย่าตอบกลับ</p>
                    </div>
                </div>
            </body>
            </html>
            "#,
            company_name
        );

        self.send_email(company_email, subject, &html_body).await
    }

    /// Send email notification to company when someone applies for a job
    pub async fn send_job_application_notification(
        &self,
        company_email: &str,
        company_name: &str,
        applicant_name: &str,
        job_title: &str,
        applicant_email: &str,
    ) -> Result<()> {
        let subject = format!("🎯 มีผู้สมัครงานใหม่สำหรับตำแหน่ง {} - Smart Persona", job_title);
        
        let html_body = format!(
            r#"<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="th">
<head>
    <title></title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
        table, td, div, h1, p {{ font-family: Arial, sans-serif; }}
        img {{ border: 0; }}
    </style>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;">
    <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;background:#ffffff;">
        <tr>
            <td align="center" style="padding:0;">
                <table role="presentation" style="background-color:#101746;width:602px;border-collapse:collapse;text-align:left;border:10px;">
                    <tr>
                        <td style="padding:0 0 20px 0;">
                            <img src="https://4cc70d890c.imgdist.com/public/users/Integrators/BeeProAgency/1138861_1121947/Screenshot%202024-12-12%20at%206.46.52%E2%80%AFPM.png"
                                width="200" alt="Smart Persona" style="display:block;margin:20px auto 0 auto;">
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <table width="100%" style="padding:0;">
                                <tr>
                                    <td style="padding:10px;">
                                        <h1 style="margin:0;text-align:center;font-size:22px;line-height:1.5;color:#ffffff;">
                                            🎯 มีผู้สมัครงานใหม่!
                                        </h1>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <table width="100%">
                                <tr>
                                    <td style="padding:25px;">
                                        <p style="color:#ffffff;text-align:center;font-size:16px;line-height:1.8;margin:0;">
                                            สวัสดี <strong>{}</strong>,<br><br>
                                            มีผู้สมัครงานใหม่สำหรับตำแหน่ง<br>
                                            <strong style="font-size:18px;">{}</strong><br><br>
                                            <strong>ข้อมูลผู้สม ัคร:</strong><br>
                                            ชื่อ: <strong>{}</strong><br>
                                            อีเมล: <strong>{}</strong><br><br>
                                            กรุณาเข้าสู่ระบบเพื่อดูข้อมูลผู้สมัครและตัดสินใจ
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding:10px 0 30px 0;">
                                        <a href="https://smartpersona.com/company-public-profile" style="background-color:#ffffff;color:#101746;padding:12px 20px;border-radius:5px;text-decoration:none;font-weight:bold;display:inline-block;">
                                            ดูรายละเอียดผู้สมัคร
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
                <table role="presentation" style="width:602px;background:#303030;border-collapse:collapse;">
                    <tr>
                        <td style="padding:20px;text-align:center;color:#ffffff;">
                            <p style="margin:0;font-size:24px;letter-spacing:2px;">SMART PERSONA</p>
                            <p style="margin:10px 0 0 0;font-size:14px;">
                                ระบบจับคู่งานอัจฉริยะ
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>"#,
            company_name,
            job_title,
            applicant_name,
            applicant_email
        );

        self.send_email(company_email, &subject, &html_body).await
    }

    /// Send email notification to user when they are accepted for a job
    pub async fn send_job_acceptance_notification(
        &self,
        applicant_email: &str,
        applicant_name: &str,
        company_name: &str,
        job_title: &str,
        company_email: &str,
    ) -> Result<()> {
        let subject = format!("🎉 ยินดีด้วย! {} สนใจประวัติของคุณ - Smart Persona", company_name);
        
        let html_body = format!(
            r#"<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="th">
<head>
    <title></title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
        table, td, div, h1, p {{ font-family: Arial, sans-serif; }}
        img {{ border: 0; }}
    </style>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;">
    <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;background:#ffffff;">
        <tr>
            <td align="center" style="padding:0;">
                <table role="presentation" style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);width:602px;border-collapse:collapse;text-align:left;border:10px;">
                    <tr>
                        <td style="padding:0 0 20px 0;">
                            <img src="https://4cc70d890c.imgdist.com/public/users/Integrators/BeeProAgency/1138861_1121947/Screenshot%202024-12-12%20at%206.46.52%E2%80%AFPM.png"
                                width="200" alt="Smart Persona" style="display:block;margin:20px auto 0 auto;">
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <table width="100%" style="padding:0;">
                                <tr>
                                    <td style="padding:10px;">
                                        <h1 style="margin:0;text-align:center;font-size:26px;line-height:1.5;color:#ffffff;">
                                            🎉 ยินดีด้วย!
                                        </h1>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <table width="100%">
                                <tr>
                                    <td style="padding:25px;">
                                        <p style="color:#ffffff;text-align:center;font-size:16px;line-height:1.8;margin:0;">
                                            สวัสดี คุณ<strong>{}</strong>,<br><br>
                                            เรามีข่าวดี! <strong style="font-size:18px;">{}</strong> สนใจประวัติของคุณ<br>
                                            สำหรับตำแหน่ง <strong>{}</strong><br><br>
                                            <strong>ขั้นตอนต่อไป:</strong><br>
                                            ทางบริษัทจะติดต่อกลับไปที่คุณเร็วๆ นี้<br>
                                            กรุณาตรวจสอบอีเมลและโทรศัพท์ของคุณ<br><br>
                                            หากต้องการติดต่อบริษัทโดยตรง:<br>
                                            <strong>{}</strong>
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:0 25px 25px 25px;">
                                        <p style="color:#ffffff;font-size:16px;line-height:1.8;text-align:center;margin:0;">
                                            ขอให้โชคดีกับการสัมภาษณ์!<br>
                                            ทีมงาน Smart Persona
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
                <table role="presentation" style="width:602px;background:#303030;border-collapse:collapse;">
                    <tr>
                        <td style="padding:20px;text-align:center;color:#ffffff;">
                            <p style="margin:0;font-size:24px;letter-spacing:2px;">SMART PERSONA</p>
                            <p style="margin:10px 0 0 0;font-size:14px;">
                                ระบบจับคู่งานอัจฉริยะ<br>
                                ขอให้ประสบความสำเร็จในเส้นทางอาชีพของคุณ
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>"#,
            applicant_name,
            company_name,
            job_title,
            company_email
        );

        self.send_email(applicant_email, &subject, &html_body).await
    }
}

