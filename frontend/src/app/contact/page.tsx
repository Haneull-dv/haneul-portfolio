"use client";

import React, { useState } from 'react';
import Layout from '@/shared/components/Layout/Layout';
import PageHeader from '@/shared/components/PageHeader/PageHeader';
import CardContainer from '@/shared/components/CardContainer/CardContainer';
import Card from '@/shared/components/Card/Card';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Contact', active: true }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // 여기에 실제 폼 제출 로직을 추가할 수 있습니다
    alert('메시지가 전송되었습니다!');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const contactInfo = [
    {
      icon: 'bx bx-envelope',
      label: 'Email',
      value: 'haneul@example.com',
      link: 'mailto:haneul@example.com'
    },
    {
      icon: 'bx bx-phone',
      label: 'Phone',
      value: '+82 10-1234-5678',
      link: 'tel:+821012345678'
    },
    {
      icon: 'bx bx-map',
      label: 'Location',
      value: 'Seoul, South Korea',
      link: '#'
    },
    {
      icon: 'bxl-linkedin',
      label: 'LinkedIn',
      value: 'linkedin.com/in/haneulkim',
      link: 'https://linkedin.com/in/haneulkim'
    }
  ];

  const socialLinks = [
    { icon: 'bxl-github', name: 'GitHub', url: 'https://github.com/haneulkim' },
    { icon: 'bxl-linkedin', name: 'LinkedIn', url: 'https://linkedin.com/in/haneulkim' },
    { icon: 'bxl-twitter', name: 'Twitter', url: 'https://twitter.com/haneulkim' },
    { icon: 'bxl-instagram', name: 'Instagram', url: 'https://instagram.com/haneulkim' }
  ];

  return (
    <Layout>
      <PageHeader 
        title="Contact" 
        breadcrumbs={breadcrumbs}
        actions={
          <a href="#" className="btn-download">
            <i className='bx bx-download bx-fade-down-hover'></i>
            <span className="text">Download vCard</span>
          </a>
        }
      />

      <CardContainer columns={2} gap="large">
        <Card 
          title="Send Message" 
          headerActions={
            <>
              <i className='bx bx-send'></i>
              <i className='bx bx-dots-vertical-rounded'></i>
            </>
          }
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '500',
                  color: 'var(--dark)'
                }}>
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--grey)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--blue)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--grey)'}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '500',
                  color: 'var(--dark)'
                }}>
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--grey)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--blue)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--grey)'}
                />
              </div>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                color: 'var(--dark)'
              }}>
                Subject *
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--grey)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--blue)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--grey)'}
              />
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                color: 'var(--dark)'
              }}>
                Message *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                required
                rows={6}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--grey)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.3s ease',
                  resize: 'vertical'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--blue)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--grey)'}
              />
            </div>

            <button
              type="submit"
              style={{
                padding: '12px 24px',
                backgroundColor: 'var(--blue)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--blue)'}
            >
              <i className='bx bx-send'></i>
              Send Message
            </button>
          </form>
        </Card>

        <Card 
          title="Contact Information" 
          headerActions={
            <>
              <i className='bx bx-info-circle'></i>
              <i className='bx bx-dots-vertical-rounded'></i>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {contactInfo.map((info, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: 'var(--blue)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '20px'
                }}>
                  <i className={info.icon}></i>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500', color: 'var(--dark)', marginBottom: '4px' }}>
                    {info.label}
                  </div>
                  <a 
                    href={info.link}
                    style={{
                      color: 'var(--dark-grey)',
                      textDecoration: 'none',
                      fontSize: '14px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--blue)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--dark-grey)'}
                  >
                    {info.value}
                  </a>
                </div>
              </div>
            ))}

            <div style={{ 
              marginTop: '20px', 
              paddingTop: '20px', 
              borderTop: '1px solid var(--grey)' 
            }}>
              <h4 style={{ 
                margin: '0 0 16px 0', 
                color: 'var(--dark)',
                fontSize: '16px',
                fontWeight: '600'
              }}>
                Follow Me
              </h4>
              <div style={{ display: 'flex', gap: '12px' }}>
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: 'var(--grey)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--dark)',
                      fontSize: '18px',
                      textDecoration: 'none',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--blue)';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--grey)';
                      e.currentTarget.style.color = 'var(--dark)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <i className={social.icon}></i>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </CardContainer>
    </Layout>
  );
};

export default ContactPage; 