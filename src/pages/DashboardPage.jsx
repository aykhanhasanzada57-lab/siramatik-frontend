import { useState, useEffect } from 'react';
import { Table, Tag, Typography, Card, Space, Badge, App, Layout, Menu, Button, Tabs, Popconfirm, Modal, DatePicker, Divider, Row, Col } from 'antd';
import { DashboardOutlined, LogoutOutlined, UserOutlined, SettingOutlined, CalendarOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { AppointmentAPI, AuthAPI, ProviderAPI } from '../api';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import SettingsSection from '../components/SettingsSection';
import CalendarPlanner from '../components/CalendarPlanner';
import SlotPicker from '../components/SlotPicker';
import BookingForm from '../components/BookingForm';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

const DashboardPage = () => {
    const { message } = App.useApp();
    const [loading, setLoading] = useState(false);
    const [appointments, setAppointments] = useState([]);
    const [provider, setProvider] = useState(null);
    const [settings, setSettings] = useState(null);
    const [activeTab, setActiveTab] = useState('1');
    const [isManualBookingOpen, setIsManualBookingOpen] = useState(false);
    const [manualBookingDate, setManualBookingDate] = useState(dayjs());
    const [manualBookingSlots, setManualBookingSlots] = useState([]);
    const [manualBookingLoading, setManualBookingLoading] = useState(false);
    const [selectedManualSlot, setSelectedManualSlot] = useState(null);
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
            setSettings(provRes.data.settings);
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

    const handleDelete = async (id) => {
        try {
            setLoading(true);
            await AppointmentAPI.delete(id);
            message.success("Rezervasiya silindi.");
            // Refresh local state
            setAppointments(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            message.error("Silərkən xəta: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchManualSlots = async (date) => {
        try {
            setManualBookingLoading(true);
            setSelectedManualSlot(null);
            const res = await ProviderAPI.getSlots('berber-aydin', date.format('YYYY-MM-DD'));
            setManualBookingSlots(res.data);
        } catch (err) {
            message.error("Saatları yükləyərkən xəta.");
        } finally {
            setManualBookingLoading(false);
        }
    };

    const handleManualBookingSubmit = async (values) => {
        try {
            setLoading(true);
            const payload = {
                provider_slug: 'berber-aydin',
                customer_name: values.name,
                customer_phone: values.phone,
                date: manualBookingDate.format('YYYY-MM-DD'),
                time: selectedManualSlot.time,
                agree_to_rules: true
            };
            await AppointmentAPI.book(payload);
            message.success("Rezervasiya yaradıldı.");
            setIsManualBookingOpen(false);
            fetchInitialData(); // Refresh list
        } catch (err) {
            message.error("Xəta: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isManualBookingOpen) {
            fetchManualSlots(manualBookingDate);
        }
    }, [isManualBookingOpen, manualBookingDate]);

    const columns = [
        {
            title: 'Müştəri',
            dataIndex: 'customer_name',
            key: 'customer_name',
            width: 140,
            ellipsis: true,
            render: (text) => <Text strong>{text}</Text>
        },
        {
            title: 'Telefon',
            dataIndex: 'customer_phone',
            key: 'customer_phone',
            width: 140,
        },
        {
            title: 'Tarix',
            dataIndex: 'booking_date',
            key: 'booking_date',
            width: 100,
            render: (date) => dayjs(date).format('DD MMM'),
            sorter: (a, b) => dayjs(a.booking_date).unix() - dayjs(b.booking_date).unix()
        },
        {
            title: 'Saat',
            dataIndex: 'start_time',
            key: 'start_time',
            width: 80,
            render: (time) => <Tag color="blue">{time.substring(0, 5)}</Tag>,
        },
        {
            title: 'Əməliyyat',
            key: 'action',
            width: 100,
            render: (_, record) => (
                <Popconfirm
                    title="Bu rezervasiyanı silmək istədiyinizə əminsiniz?"
                    onConfirm={() => handleDelete(record.id)}
                    okText="Bəli"
                    cancelText="Xeyr"
                    okButtonProps={{ danger: true }}
                >
                    <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />} 
                        size="small"
                    >
                        Sil
                    </Button>
                </Popconfirm>
            ),
        }
    ];

    const tabItems = [
        {
            key: '1',
            label: 'Sifarişlər',
            icon: <DashboardOutlined />,
            children: (
                <Space orientation="vertical" style={{ width: '100%' }} size="large">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <Title level={5} style={{ margin: 0 }}>Gələn Sifarişlərin Siyahısı</Title>
                            <Badge count={appointments.length} overflowCount={999} />
                        </div>
                        <Button 
                            type="primary" 
                            icon={<PlusOutlined />} 
                            onClick={() => setIsManualBookingOpen(true)}
                            className="premium-btn"
                        >
                            Yeni Sifariş
                        </Button>
                    </div>
                    <Table
                        columns={columns}
                        dataSource={appointments}
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                        scroll={{ x: 'max-content' }}
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

            {/* Manual Booking Modal for Admin */}
            <Modal
                title={<Title level={4} style={{ margin: 0 }}><PlusOutlined /> Yeni Növbə Əlavə Et</Title>}
                open={isManualBookingOpen}
                onCancel={() => setIsManualBookingOpen(false)}
                footer={null}
                width={800}
                centered
            >
                <Row gutter={[24, 24]}>
                    <Col xs={24} md={12}>
                        <div style={{ marginBottom: 16 }}>
                            <Text strong style={{ display: 'block', marginBottom: 8 }}>Tarix Seçin:</Text>
                            <DatePicker 
                                value={manualBookingDate} 
                                onChange={setManualBookingDate} 
                                style={{ width: '100%' }}
                                size="large"
                                format="DD MMMM YYYY"
                                allowClear={false}
                            />
                        </div>
                        <Divider dashed>Mövcud Saatlar</Divider>
                        <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
                            <SlotPicker 
                                slots={manualBookingSlots} 
                                loading={manualBookingLoading}
                                selectedSlot={selectedManualSlot}
                                onSelect={setSelectedManualSlot}
                                isAdmin={true}
                            />
                        </div>
                    </Col>
                    <Col xs={24} md={12}>
                        {!selectedManualSlot ? (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0' }}>
                                <Badge status="processing" text="Zəhmət olmasa soldan saat seçin" />
                            </div>
                        ) : (
                            <Card variant="borderless" style={{ background: '#f8fafc', borderRadius: '12px' }}>
                                <BookingForm 
                                    selectedDate={manualBookingDate.format('DD MMMM YYYY')}
                                    selectedTime={selectedManualSlot.time}
                                    earlyArrival={settings?.early_arrival_minutes}
                                    onSubmit={handleManualBookingSubmit}
                                />
                            </Card>
                        )}
                    </Col>
                </Row>
            </Modal>

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
                }
                @media (max-width: 576px) {
                    .ant-table-cell {
                        padding: 8px 4px !important;
                        font-size: 13px;
                    }
                    .ant-tag {
                        margin-right: 0;
                        font-size: 11px;
                    }
                }
            `}</style>
        </Layout>
    );
};

export default DashboardPage;
