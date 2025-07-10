"use client";

import React, { useState } from 'react';
import Layout from '@/shared/components/Layout/Layout';
import PageHeader from '@/shared/components/PageHeader/PageHeader';
import CardContainer from '@/shared/components/CardContainer/CardContainer';
import Card from '@/shared/components/Card/Card';
import { FaGithub, FaInstagram } from 'react-icons/fa';
import styles from '../about/about.module.scss';

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
      value: 'haneull.dv@gmail.com',
      link: 'haneull.dv@gmail.com'
    },
    {
      icon: 'bx bx-phone',
      label: 'Phone',
      value: '+82 10-9165-7262',
      link: 'tel:+821091657262'
    },
    {
      icon: 'bx bx-map',
      label: 'Location',
      value: 'Gyeonggi-do, South Korea',
      link: '#'
    }
  ];

  const socialLinks = [
    { icon: <FaGithub size={28} />, name: 'GitHub', url: 'https://github.com/Haneull-dv/haneul-portfolio' },
    { icon: <FaInstagram size={28} />, name: 'Instagram', url: 'https://instagram.com/skyyy_neul' }
  ];

  return (
    <Layout>
      <div className={styles.pageWrapper}>
        <div className={styles.card}>
          <div className={styles.breadcrumbs}>
            <span className={styles.breadcrumbLink} style={{ color: '#6b7280', fontWeight: 500 }}>Dashboard</span>
            <span className={styles.breadcrumbSeparator}>/</span>
            <span className={styles.breadcrumbCurrent}>Contact</span>
          </div>
          <h2 className={styles.cardTitle}>Contact</h2>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <a href="#" className={styles.actionButton} style={{ width: 'auto', maxWidth: 180 }}>
              <i className='bx bx-download bx-fade-down-hover'></i>
              <span>Download vCard</span>
            </a>
          </div>
        </div>
        <div className={styles.validationGrid}>
          <div className={styles.card}>
            <h3>Send Message</h3>
            <div style={{ background: '#f9f9f9', border: 'none', borderRadius: 0, padding: 18, marginBottom: 12, color: '#111827', fontSize: '15px', lineHeight: 1.7 }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--dark)' }}>Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className={styles.formInput} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--dark)' }}>Email *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className={styles.formInput} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--dark)' }}>Subject *</label>
                  <input type="text" name="subject" value={formData.subject} onChange={handleInputChange} required className={styles.formInput} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--dark)' }}>Message *</label>
                  <textarea name="message" value={formData.message} onChange={handleInputChange} required rows={6} className={styles.formInput} style={{ resize: 'vertical' }} />
                </div>
                <button type="submit" className={styles.actionButton} style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <i className='bx bx-send'></i>
                  Send Message
                </button>
              </form>
            </div>
          </div>
          <div className={styles.card}>
            <h3>Contact Information</h3>
            <div style={{ background: '#f9f9f9', border: 'none', borderRadius: 0, padding: 18, marginBottom: 12, color: '#111827', fontSize: '15px', lineHeight: 1.7 }}>
              {contactInfo.map((info, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: 18 }}>
                  <div style={{ width: '48px', height: '48px', backgroundColor: '#173e92', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px' }}>
                    <i className={info.icon}></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500', color: 'var(--dark)', marginBottom: '4px' }}>{info.label}</div>
                    <a href={info.link} style={{ color: '#374151', textDecoration: 'none', fontSize: '14px' }}>{info.value}</a>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                <h4 style={{ margin: '0 0 16px 0', color: 'var(--dark)', fontSize: '16px', fontWeight: '600' }}>Follow Me</h4>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {socialLinks.map((link, idx) => (
                    <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" style={{ width: '40px', height: '40px', backgroundColor: '#e5e7eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#173e92', fontSize: '18px', textDecoration: 'none', transition: 'all 0.3s ease' }}>
                      {link.icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ContactPage; 