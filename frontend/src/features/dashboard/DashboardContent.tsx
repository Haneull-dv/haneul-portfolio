"use client";

import styles from './DashboardContent.module.scss';

interface StatCardProps {
  icon: string;
  value: string;
  label: string;
}

interface Order {
  id: number;
  user: {
    name: string;
    image: string;
  };
  date: string;
  status: 'completed' | 'pending' | 'process';
}

interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label }) => (
  <li>
    <i className={`bx ${icon}`}></i>
    <span className={styles.text}>
      <h3>{value}</h3>
      <p>{label}</p>
    </span>
  </li>
);

const orders: Order[] = [
  { id: 1, user: { name: 'Micheal John', image: 'https://placehold.co/600x400/png' }, date: '18-10-2021', status: 'completed' },
  { id: 2, user: { name: 'Ryan Doe', image: 'https://placehold.co/600x400/png' }, date: '01-06-2022', status: 'pending' },
  { id: 3, user: { name: 'Tarry White', image: 'https://placehold.co/600x400/png' }, date: '14-10-2021', status: 'process' },
  { id: 4, user: { name: 'Selma', image: 'https://placehold.co/600x400/png' }, date: '01-02-2023', status: 'pending' },
  { id: 5, user: { name: 'Andreas Doe', image: 'https://placehold.co/600x400/png' }, date: '31-10-2021', status: 'completed' },
];

const todos: TodoItem[] = [
  { id: 1, text: 'Check Inventory', completed: true },
  { id: 2, text: 'Manage Delivery Team', completed: true },
  { id: 3, text: 'Contact Selma: Confirm Delivery', completed: false },
  { id: 4, text: 'Update Shop Catalogue', completed: true },
  { id: 5, text: 'Count Profit Analytics', completed: false },
];

const DashboardContent: React.FC = () => {
  return (
    <main className={styles.main}>
      <div className={styles.headTitle}>
        <div className={styles.left}>
          <h1>Dashboard</h1>
          <ul className={styles.breadcrumb}>
            <li>
              <a href="#">Dashboard</a>
            </li>
            <li><i className='bx bx-chevron-right'></i></li>
            <li>
              <a className={styles.active} href="#">Home</a>
            </li>
          </ul>
        </div>
        <a href="#" className={styles.btnDownload}>
          <i className='bx bxs-cloud-download bx-fade-down-hover'></i>
          <span className={styles.text}>Get PDF</span>
        </a>
      </div>

      <ul className={styles.boxInfo}>
        <StatCard 
          icon="bxs-calendar-check" 
          value="1020" 
          label="New Order" 
        />
        <StatCard 
          icon="bxs-group" 
          value="2834" 
          label="Visitors" 
        />
        <StatCard 
          icon="bxs-dollar-circle" 
          value="N$2543.00" 
          label="Total Sales" 
        />
      </ul>

      <div className={styles.tableData}>
        <div className={styles.order}>
          <div className={styles.head}>
            <h3>Recent Orders</h3>
            <i className='bx bx-search'></i>
            <i className='bx bx-filter'></i>
          </div>
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Date Order</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <img src={order.user.image} alt={order.user.name} />
                    <p>{order.user.name}</p>
                  </td>
                  <td>{order.date}</td>
                  <td>
                    <span className={`${styles.status} ${styles[order.status]}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className={styles.todo}>
          <div className={styles.head}>
            <h3>Todos</h3>
            <i className='bx bx-plus icon'></i>
            <i className='bx bx-filter'></i>
          </div>
          <ul className={styles.todoList}>
            {todos.map((todo) => (
              <li key={todo.id} className={todo.completed ? styles.completed : styles.notCompleted}>
                <p>{todo.text}</p>
                <i className='bx bx-dots-vertical-rounded'></i>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
};

export default DashboardContent; 