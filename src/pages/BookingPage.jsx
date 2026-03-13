import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { UserOutlined, CalendarOutlined, LoginOutlined, InfoCircleOutlined, GithubOutlined, RocketOutlined, WhatsAppOutlined, PhoneOutlined } from '@ant-design/icons';
import { Spin, Row, Col, Typography, Card, Calendar, message, Badge, Result, Button, FloatButton, Modal, Space, Tooltip, Divider, Tag } from 'antd';
import dayjs from 'dayjs';
import { ProviderAPI, AppointmentAPI } from '../api';
import BookingForm from '../components/BookingForm';
import SlotPicker from '../components/SlotPicker';
import styles from '../styles/BookingPage.module.scss';
import 'dayjs/locale/az';

dayjs.locale('az');

const { Title, Text } = Typography;

const BookingPage = () => {
    const { slug } = useParams();
    const [loading, setLoading] = useState(true);
    const [provider, setProvider] = useState(null);
    const [error, setError] = useState(null);

    // Selection State
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

    // Slots State
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [slots, setSlots] = useState([]);

    useEffect(() => {
        fetchProviderInfo();
    }, [slug]);

    useEffect(() => {
        if (provider) {
            fetchSlots(selectedDate.format('YYYY-MM-DD'));
        }
    }, [selectedDate, provider]);


    const fetchProviderInfo = async () => {
        try {
            setLoading(true);
            const res = await ProviderAPI.getDetails(slug);
            setProvider(res.data);
            setError(null);
        } catch (err) {
            setError(err.message || "Xidmət verən tapılmadı");
        } finally {
            setLoading(false);
        }
    };

    const fetchSlots = async (date) => {
        try {
            setSlotsLoading(true);
            setSelectedSlot(null); // Reset selected slot on date change
            const res = await ProviderAPI.getSlots(slug, date);
            setSlots(res.data || []);
        } catch (err) {
            message.error("Saatları yükləyərkən xəta baş verdi");
            setSlots([]);
        } finally {
            setSlotsLoading(false);
        }
    };

    const handleDateChange = (date) => {
        // Prevent selecting past dates or dates beyond max_advance_days
        const maxDays = provider?.settings?.max_advance_days || 7;
        const maxValidDate = dayjs().add(maxDays, 'day');

        if (date.isBefore(dayjs(), 'day') || date.isAfter(maxValidDate, 'day')) {
            message.warning(`Yalnız bu gün və növbəti ${maxDays} gün üçün təyin edə bilərsiniz.`);
            return;
        }
        setSelectedDate(date);
    };

    const handleSlotSelect = (slot) => {
        if (slot.status === 'available') {
            setSelectedSlot(slot);
        }
    };

    const handleBookingSubmit = async (values) => {
        if (!selectedSlot) return;

        try {
            message.loading({ content: 'Rezervasiya edilir...', key: 'booking' });

            const payload = {
                provider_slug: slug,
                customer_name: values.name,
                customer_phone: values.phone,
                date: selectedDate.format('YYYY-MM-DD'),
                time: selectedSlot.time,
                agree_to_rules: values.agree
            };

            await AppointmentAPI.book(payload);
            message.success({ content: 'Rezervasiyanız uğurla qeydə alındı!', key: 'booking', duration: 4 });

            // Refresh slots after successful booking
            fetchSlots(selectedDate.format('YYYY-MM-DD'));
            // Could add a "Success Component" mode here
        } catch (err) {
            message.error({ content: err.message || 'Xəta baş verdi', key: 'booking', duration: 3 });
            // Re-fetch slots in case someone else booked it (concurrency)
            fetchSlots(selectedDate.format('YYYY-MM-DD'));
        }
    };

    if (loading) return <div className={styles.centerLoad}><Spin size="large" /></div>;

    if (error) return (
        <div className={styles.centerLoad}>
            <Result status="404" title="404" subTitle={error} />
        </div>
    );

    return (
        <div className={styles.container}>
            <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <Title level={2}><UserOutlined /> {provider.full_name}</Title>
                    <Text type="secondary">Xidmət qeydiyyat sistemi</Text>
                </div>
                <Button 
                    type="text" 
                    icon={<InfoCircleOutlined style={{ fontSize: '20px', color: '#1890ff' }} />} 
                    onClick={() => setIsAboutModalOpen(true)}
                    style={{ padding: '4px' }}
                />
            </div>

            <Row gutter={[24, 24]} className={styles.contentRow}>
                {/* Left Column: Calendar & Slots */}
                <Col xs={24} md={14} lg={16}>
                    <Card title="Tarix və Saat seçimi" className={styles.card}>
                        <div className={styles.pickerContainer}>
                            <div className={styles.calendarArea}>
                                <Calendar
                                    fullscreen={false}
                                    value={selectedDate}
                                    onChange={handleDateChange}
                                    disabledDate={(current) => {
                                        const maxDays = provider?.settings?.max_advance_days || 7;
                                        return current && (current < dayjs().startOf('day') || current > dayjs().add(maxDays, 'day'));
                                    }}
                                />
                            </div>
                            <div className={styles.slotsArea}>
                                <Title level={5}><CalendarOutlined /> {selectedDate.format('DD MMMM, dddd')}</Title>
                                <SlotPicker
                                    slots={slots}
                                    loading={slotsLoading}
                                    selectedSlot={selectedSlot}
                                    onSelect={handleSlotSelect}
                                />
                            </div>
                        </div>
                    </Card>
                </Col>

                {/* Right Column: Form */}
                <Col xs={24} md={10} lg={8}>
                    <Card title="Qeydiyyat Formu" className={styles.card}>
                        {!selectedSlot ? (
                            <div className={styles.emptyForm}>
                                <Badge status="processing" text="Zəhmət olmasa təqvimdən boş saat seçin" />
                            </div>
                        ) : (
                            <BookingForm
                                selectedDate={selectedDate.format('DD MMMM YYYY')}
                                selectedTime={selectedSlot.time}
                                earlyArrival={provider?.settings?.early_arrival_minutes}
                                onSubmit={handleBookingSubmit}
                            />
                        )}
                    </Card>
                </Col>
            </Row>

            <FloatButton
                icon={<LoginOutlined />}
                tooltip={<div>Admin Girişi</div>}
                onClick={() => window.location.href = '/login'}
                style={{ right: 24, bottom: 24 }}
            />

            <Modal
                title="SiraMatik haqqında"
                open={isAboutModalOpen}
                onCancel={() => setIsAboutModalOpen(false)}
                footer={null}
                centered
                width={500}
                styles={{ 
                    body: { padding: 0, overflow: 'hidden' },
                    header: { padding: '16px 24px', margin: 0, borderBottom: '1px solid #f0f0f0' }
                }}
            >
                <div style={{
                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                    padding: '40px 24px',
                    textAlign: 'center',
                    color: '#fff'
                }}>
                    <Title level={3} style={{ color: '#fff', margin: '0 0 8px 0' }}>SiraMatik</Title>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px' }}>Gələcəyin Rezervasiya Sistemi</Text>
                </div>
                
                <div style={{ padding: '32px 24px' }}>
                    <div style={{ marginBottom: '24px' }}>
                        <Title level={4} style={{ marginBottom: '12px' }}>SiraMatik nədir?</Title>
                        <Text style={{ color: '#475569', lineHeight: '1.7', fontSize: '15px' }}>
                            SiraMatik, xidmət sahəsində çalışan peşəkarlar (bərbərlər, həkimlər, ustalar və s.) üçün nəzərdə tutulmuş müasir onlayn rezervasiya platformasıdır. Bizim məqsədimiz həm müştərilərin vaxtına qənaət etmək, həm də xidmət verənlərin işini daha sistemli hala gətirməkdir.
                        </Text>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <Title level={5} style={{ marginBottom: '12px' }}>İstifadə qaydası:</Title>
                        <ul style={{ paddingLeft: '20px', color: '#475569', lineHeight: '1.8' }}>
                            <li>Təqvimdən sizə uyğun tarixi seçin.</li>
                            <li>Açılan siyahıdan boş saatı müəyyən edin.</li>
                            <li>Məlumatlarınızı daxil edin və "Sifarişi Təsdiqlə" düyməsinə basın.</li>
                            <li>Sifarişiniz dərhal admin tərəfindən görüləcək!</li>
                        </ul>
                    </div>

                    <Divider style={{ margin: '16px 0' }} />

                    <div style={{ marginBottom: '24px' }}>
                        <Title level={4} style={{ marginBottom: '12px' }}>Yaradıcı haqqında</Title>
                        <Text style={{ color: '#475569', lineHeight: '1.7', fontSize: '15px' }}>
                            Mən <strong>Ayxan Həsənzadə</strong>, Full-Stack Developer və SiraMatik proyektinin yaradıcısıyam. Kiçik və orta bizneslər üçün idarəetmə sistemlərindən tutmuş, mobil tətbiqlərə, veb saytlara və bütün növ rəqəmsal həllərin sıfırdan yığılmasına qədər peşəkar xidmət göstərirəm.
                        </Text>
                    </div>

                    <Divider style={{ margin: '16px 0' }} />

                    <div style={{ marginBottom: '24px' }}>
                        <Title level={5} style={{ marginBottom: '12px' }}>Texnoloji Stack</Title>
                        <Space wrap size={[12, 12]}>
                            <Tag color="blue" bordered={false}>Java</Tag>
                            <Tag color="red" bordered={false}>PHP</Tag>
                            <Tag color="cyan" bordered={false}>MySQL</Tag>
                            <Tag color="purple" bordered={false}>React</Tag>
                            <Tag color="orange" bordered={false}>React Native (Mobile)</Tag>
                        </Space>
                    </div>

                    <Divider style={{ margin: '16px 0' }} />

                    <Title level={5} style={{ marginBottom: '16px' }}>Mənimlə əlaqə</Title>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <Button 
                            type="primary" 
                            icon={<WhatsAppOutlined />} 
                            href={`https://wa.me/994709111228?text=${encodeURIComponent('Salam, mən SiraMatik proqramından gəlirəm, sizə bir neçə sualım olacaqdı')}`}
                            target="_blank"
                            style={{ background: '#25D366', borderColor: '#25D366', borderRadius: '8px', height: '42px' }}
                        >
                            WhatsApp
                        </Button>
                        <Button 
                            icon={<PhoneOutlined />} 
                            href="tel:+994709111228"
                            style={{ borderRadius: '8px', height: '42px' }}
                        >
                            Zəng et
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default BookingPage;
