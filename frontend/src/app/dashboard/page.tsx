"use client";

import React from 'react';
import Layout from '@/shared/components/Layout/Layout';
import PageHeader from '@/shared/components/PageHeader/PageHeader';
import CardContainer from '@/shared/components/CardContainer/CardContainer';
import Card from '@/shared/components/Card/Card';

const DashboardPage: React.FC = () => {
  const breadcrumbs = [
    { label: 'Dashboard', active: true },
    { label: 'Home' }
  ];

  const stats = [
    {
      icon: 'bx bxs-calendar-check',
      value: '1020',
      label: 'New Order',
      color: '#4caf50'
    },
    {
      icon: 'bx bxs-group',
      value: '2834',
      label: 'Visitors',
      color: '#2196f3'
    },
    {
      icon: 'bx bxs-dollar-circle',
      value: 'N$2543.00',
      label: 'Total Sales',
      color: '#ff9800'
    }
  ];

  const recentOrders = [
    {
      user: 'Micheal John',
      date: '18-10-2021',
      status: 'Completed',
      avatar: 'https://placehold.co/36x36/4285f4/ffffff?text=MJ'
    },
    {
      user: 'Ryan Doe',
      date: '01-06-2022',
      status: 'Pending',
      avatar: 'https://placehold.co/36x36/34a853/ffffff?text=RD'
    },
    {
      user: 'Tarry White',
      date: '14-10-2021',
      status: 'Process',
      avatar: 'https://placehold.co/36x36/ff9800/ffffff?text=TW'
    },
    {
      user: 'Selma',
      date: '01-02-2023',
      status: 'Pending',
      avatar: 'https://placehold.co/36x36/9c27b0/ffffff?text=S'
    },
    {
      user: 'Andreas Doe',
      date: '31-10-2021',
      status: 'Completed',
      avatar: 'https://placehold.co/36x36/f44336/ffffff?text=AD'
    }
  ];

  const todos = [
    { task: 'Check Inventory', completed: true },
    { task: 'Manage Delivery Team', completed: true },
    { task: 'Contact Selma: Confirm Delivery', completed: false },
    { task: 'Update Shop Catalogue', completed: true },
    { task: 'Review Customer Feedback', completed: false }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return '#4caf50';
      case 'Pending': return '#ff9800';
      case 'Process': return '#2196f3';
      default: return '#757575';
    }
  };

  return (
    <Layout>
      <PageHeader 
        title="Dashboard" 
        breadcrumbs={breadcrumbs}
        actions={
          <a href="#" className="btn-download">
            <i className='bx bxs-cloud-download bx-fade-down-hover'></i>
            <span className="text">Get PDF</span>
          </a>
        }
      />

      {/* Stats Cards */}
      <div style={{ marginBottom: '32px' }}>
        <CardContainer columns={3} gap="medium">
          {stats.map((stat, index) => (
            <Card key={index} className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: stat.color,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '24px'
                }}>
                  <i className={stat.icon}></i>
                </div>
                <div>
                  <h3 style={{ 
                    margin: '0 0 4px 0', 
                    fontSize: '28px', 
                    fontWeight: '700',
                    color: 'var(--dark)'
                  }}>
                    {stat.value}
                  </h3>
                  <p style={{ 
                    margin: 0, 
                    color: 'var(--dark-grey)',
                    fontSize: '14px'
                  }}>
                    {stat.label}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </CardContainer>
      </div>

      {/* Main Content Cards */}
      <CardContainer columns={2} gap="large">
        <Card 
          title="Recent Orders" 
          headerActions={
            <>
              <i className='bx bx-search'></i>
              <i className='bx bx-filter'></i>
            </>
          }
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--grey)' }}>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '12px 0', 
                    fontWeight: '600',
                    color: 'var(--dark)'
                  }}>
                    User
                  </th>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '12px 0', 
                    fontWeight: '600',
                    color: 'var(--dark)'
                  }}>
                    Date Order
                  </th>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '12px 0', 
                    fontWeight: '600',
                    color: 'var(--dark)'
                  }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid var(--grey)' }}>
                    <td style={{ padding: '12px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img 
                          src={order.avatar} 
                          alt={order.user}
                          style={{ 
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                        />
                        <span style={{ fontWeight: '500', color: 'var(--dark)' }}>
                          {order.user}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 0', color: 'var(--dark-grey)' }}>
                      {order.date}
                    </td>
                    <td style={{ padding: '12px 0' }}>
                      <span style={{
                        padding: '4px 12px',
                        backgroundColor: getStatusColor(order.status),
                        color: 'white',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card 
          title="Todos" 
          headerActions={
            <>
              <i className='bx bx-plus'></i>
              <i className='bx bx-filter'></i>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {todos.map((todo, index) => (
              <div 
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: index < todos.length - 1 ? '1px solid var(--grey)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: todo.completed ? '#4caf50' : 'var(--grey)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px'
                  }}>
                    {todo.completed && <i className='bx bx-check'></i>}
                  </div>
                  <span style={{
                    color: todo.completed ? 'var(--dark-grey)' : 'var(--dark)',
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    fontWeight: todo.completed ? '400' : '500'
                  }}>
                    {todo.task}
                  </span>
                </div>
                <i 
                  className='bx bx-dots-vertical-rounded'
                  style={{ 
                    color: 'var(--dark-grey)', 
                    cursor: 'pointer',
                    fontSize: '18px'
                  }}
                ></i>
              </div>
            ))}
          </div>
        </Card>
      </CardContainer>
    </Layout>
  );
};

export default DashboardPage;
  