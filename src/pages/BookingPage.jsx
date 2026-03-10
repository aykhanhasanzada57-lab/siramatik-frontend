import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Spin, Row, Col, Typography, Card, Calendar, message, Badge, Result, Button, FloatButton } from 'antd';
import { UserOutlined, CalendarOutlined, LoginOutlined } from '@ant-design/icons';
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
            <div className={styles.header}>
                <Title level={2}><UserOutlined /> {provider.full_name}</Title>
                <Text type="secondary">Xidmət qeydiyyat sistemi</Text>
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
        </div>
    );
};

export default BookingPage;
