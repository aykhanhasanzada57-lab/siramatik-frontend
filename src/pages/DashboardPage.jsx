import { useState, useEffect } from 'react';
import { Table, Tag, Typography, Card, Space, Badge, message, Layout, Menu, Button, Tabs } from 'antd';
import { DashboardOutlined, LogoutOutlined, UserOutlined, SettingOutlined, CalendarOutlined } from '@ant-design/icons';
import { AppointmentAPI, AuthAPI, ProviderAPI } from '../api';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import SettingsSection from '../components/SettingsSection';
import CalendarPlanner from '../components/CalendarPlanner';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

const DashboardPage = () => {
    const [loading, setLoading] = useState(false);
    const [appointments, setAppointments] = useState([]);
    const [provider, setProvider] = useState(null);
    const [activeTab, setActiveTab] = useState('1');
    const navigate = useNavigate();

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [aptRes, provRes] = await Promise.all([
                AppointmentAPI.getAll('berber-aydin'),
                ProviderAPI.getMyDetails()
            ]);
            setAppointments(aptRes.data);
            setProvider(provRes.data.provider);
        } catch (err) {
            message.error("Məlumatları yükləyərkən xəta: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await AuthAPI.logout();
            message.success("Sistemdən çıxdınız.");
            navigate('/login');
        } catch (err) {
            navigate('/login');
        }
    };

    const columns = [
        {
            title: 'Müştəri',
            dataIndex: 'customer_name',
            key: 'customer_name',
            render: (text) => <Text strong>{text}</Text>
        },
        {
            title: 'Telefon',
            dataIndex: 'customer_phone',
            key: 'customer_phone',
        },
        {
            title: 'Tarix',
            dataIndex: 'booking_date',
            key: 'booking_date',
            render: (date) => dayjs(date).format('DD MMMM YYYY'),
            sorter: (a, b) => dayjs(a.booking_date).unix() - dayjs(b.booking_date).unix()
        },
        {
            title: 'Saat',
            dataIndex: 'start_time',
            key: 'start_time',
            render: (time) => <Tag color="blue">{time.substring(0, 5)}</Tag>,
        }
    ];

    const tabItems = [
        {
            key: '1',
            label: 'Sifarişlər',
            icon: <DashboardOutlined />,
            children: (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Title level={5}>Gələn Sifarişlərin Siyahısı</Title>
                        <Badge count={appointments.length} overflowCount={999} />
                    </div>
                    <Table
                        columns={columns}
                        dataSource={appointments}
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                    />
                </Space>
            )
        },
        {
            key: '2',
            label: 'Təqvim Planlayıcı',
            icon: <CalendarOutlined />,
            children: <CalendarPlanner />
        },
        {
            key: '3',
            label: 'Tənzimləmələr (Template)',
            icon: <SettingOutlined />,
            children: <SettingsSection />
        }
    ];

    return (
        <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <Sider
                breakpoint="lg"
                collapsedWidth="0"
                theme="light"
                style={{
                    boxShadow: '4px 0 24px rgba(0,0,0,0.03)',
                    position: 'fixed',
                    height: '100vh',
                    left: 0,
                    zIndex: 1001
                }}
            >
                <div style={{ height: 64, margin: '24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)', borderRadius: '12px' }}>
                        <Title level={4} style={{ margin: 0, color: '#fff', fontSize: '18px' }}>SiraMatik</Title>
                    </div>
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[activeTab]}
                    onClick={({ key }) => setActiveTab(key)}
                    style={{ borderRight: 0 }}
                    items={[
                        { key: '1', icon: <DashboardOutlined />, label: 'Əsas Panel' },
                        { key: '2', icon: <CalendarOutlined />, label: 'Təqvim Planı' },
                        { key: '3', icon: <SettingOutlined />, label: 'Tənzimləmələr' },
                    ]}
                />
            </Sider>
            <Layout className="site-layout" style={{ marginLeft: 0 }}>
                <Header style={{
                    background: '#fff',
                    padding: '0 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1000,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ width: '40px' }} className="mobile-spacer" />
                        <Title level={5} style={{ margin: 0 }}>
                            {provider ? provider.full_name : 'Admin'}
                        </Title>
                    </div>
                    <Space size="small">
                        <Button type="text" danger icon={<LogoutOutlined />} onClick={handleLogout}>Çıxış</Button>
                    </Space>
                </Header>
                <Content style={{ margin: '16px', minHeight: 280 }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <Tabs
                            activeKey={activeTab}
                            onChange={setActiveTab}
                            items={tabItems}
                            size="large"
                            className="premium-tabs"
                        />
                    </div>
                </Content>
            </Layout>

            <style>{`
                @media (min-width: 992px) {
                    .site-layout {
                        margin-left: 200px !important;
                    }
                    .mobile-spacer {
                        display: none;
                    }
                }
                .premium-tabs .ant-tabs-nav {
                    margin-bottom: 24px !important;
                    background: #fff;
                    padding: 4px 16px;
                    border-radius: 12px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
                }
                .ant-table-wrapper {
                    background: #fff;
                    border-radius: 12px;
                    overflow: hidden;
                }
            `}</style>
        </Layout>
    );
};

export default DashboardPage;
