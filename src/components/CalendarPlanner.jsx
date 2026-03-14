import React, { useState, useEffect } from "react";
import { Calendar, Badge, Modal, Form, TimePicker, InputNumber, Checkbox, Button, Space, Typography, Spin, App, Card, Alert } from "antd";
import { PlusOutlined, DeleteOutlined, InfoCircleOutlined, CalendarOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { ProviderAPI, AppointmentAPI } from "../api";
import dayjs from "dayjs";

const { Text, Title } = Typography;

const CalendarPlanner = () => {
    const { message } = App.useApp();
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [dailyData, setDailyData] = useState(null);
    const [appointments, setAppointments] = useState([]);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const res = await AppointmentAPI.getAll("berber-aydin");
            setAppointments(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // Optimization: Group appointments by date once
    const appointmentsMap = React.useMemo(() => {
        const map = {};
        appointments.forEach(apt => {
            const dateStr = dayjs(apt.booking_date).format("YYYY-MM-DD");
            if (!map[dateStr]) map[dateStr] = [];
            map[dateStr].push(apt);
        });
        return map;
    }, [appointments]);

    const showDateModal = async (date) => {
        setSelectedDate(date);
        try {
            setLoading(true);
            const res = await ProviderAPI.getDailySchedule(date.format("YYYY-MM-DD"));

            // If res.data is null, it means there's no override OR template for this day.
            // We default to inactive so the admin has to explicitly enable it.
            setDailyData(res.data || {
                start_time: "09:00:00",
                end_time: "18:00:00",
                slot_interval: 30,
                is_active: false, // Default to false as requested
                breaks: [],
                _isNew: !res.data // Helper flag for UI
            });
            setIsModalVisible(true);
        } catch (err) {
            message.error("Məlumatı çəkərkən xəta.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await ProviderAPI.updateDailySchedule({
                date: selectedDate.format("YYYY-MM-DD"),
                ...dailyData
            });
            message.success(`${selectedDate.format("DD MMMM")} üçün qrafik yeniləndi.`);
            setIsModalVisible(false);
        } catch (err) {
            message.error("Yadda saxlayarkən xəta.");
        } finally {
            setSaving(false);
        }
    };

    const dateCellRender = (value) => {
        const dateStr = value.format("YYYY-MM-DD");
        const listData = appointmentsMap[dateStr] || [];

        return (
            <ul className="events" style={{ listStyle: 'none', padding: 0 }}>
                {listData.map((item) => (
                    <li key={item.id}>
                        <Badge status="processing" text={`${item.start_time.substring(0, 5)} - ${item.customer_name}`} />
                    </li>
                ))}
            </ul>
        );
    };

    const handleFieldChange = (field, value) => {
        setDailyData(prev => ({ ...prev, [field]: value }));
    };

    const addBreak = () => {
        setDailyData(prev => ({
            ...prev,
            breaks: [...(prev.breaks || []), { break_start: "13:00:00", break_end: "14:00:00" }]
        }));
    };

    const removeBreak = (index) => {
        setDailyData(prev => ({
            ...prev,
            breaks: prev.breaks.filter((_, i) => i !== index)
        }));
    };

    const handleBreakChange = (index, field, value) => {
        setDailyData(prev => ({
            ...prev,
            breaks: prev.breaks.map((b, i) => i === index ? { ...b, [field]: value } : b)
        }));
    };

    return (
        <Card variant="borderless">
            <Title level={4}>Təqvim Planlayıcı</Title>
            <Text type="secondary" style={{ marginBottom: '20px', display: 'block' }}>
                Hər hansı bir tarixin üzərinə klikləyərək həmin günü <strong>İş Günü</strong> kimi aktivləşdirə və saatları seçə bilərsiniz.
            </Text>

            <Calendar
                dateCellRender={dateCellRender}
                onSelect={showDateModal}
            />

            <Modal
                title={
                    <Space>
                        <CalendarOutlined />
                        <span>{selectedDate.format("DD MMMM YYYY")} - İş Qrafiki</span>
                    </Space>
                }
                open={isModalVisible}
                onOk={handleSave}
                onCancel={() => setIsModalVisible(false)}
                confirmLoading={saving}
                width={500}
                okText="Yadda saxla"
                cancelText="Bağla"
            >
                {loading ? <Spin /> : dailyData && (
                    <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                        {!dailyData.is_active && dailyData._isNew && (
                            <Alert
                                title="Bu gün hələ quraşdırılmayıb"
                                description="Siz bu günü aktivləşdirməyincə müştərilər həmin tarixdə növbə götürə bilməyəcəklər."
                                type="warning"
                                showIcon
                                icon={<InfoCircleOutlined />}
                            />
                        )}

                        {dailyData.is_active && (
                            <Alert
                                title="Bu gün aktiv iş günüdür"
                                type="success"
                                showIcon
                                icon={<CheckCircleOutlined />}
                            />
                        )}

                        <div style={{ background: '#f9f9f9', padding: '12px', borderRadius: '8px', border: '1px solid #eee' }}>
                            <Checkbox
                                checked={dailyData.is_active}
                                onChange={e => handleFieldChange('is_active', e.target.checked)}
                                style={{ fontWeight: 'bold' }}
                            >
                                Bu günü İş Günü kimi qeyd et
                            </Checkbox>
                        </div>

                        {dailyData.is_active && (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text>İş saatları:</Text>
                                    <Space>
                                        <TimePicker
                                            format="HH:mm"
                                            value={dayjs(dailyData.start_time, "HH:mm:ss")}
                                            onChange={t => handleFieldChange("start_time", t ? t.format("HH:mm:ss") : "09:00:00")}
                                        />
                                        <Text>-</Text>
                                        <TimePicker
                                            format="HH:mm"
                                            value={dayjs(dailyData.end_time, "HH:mm:ss")}
                                            onChange={t => handleFieldChange("end_time", t ? t.format("HH:mm:ss") : "18:00:00")}
                                        />
                                    </Space>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text>Növbə intervalı (dəq):</Text>
                                    <InputNumber
                                        min={5}
                                        max={120}
                                        value={dailyData.slot_interval}
                                        onChange={v => handleFieldChange("slot_interval", v)}
                                    />
                                </div>

                                <Divider style={{ margin: '12px 0' }} />

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text strong>Fasilələr:</Text>
                                    <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addBreak}>
                                        Əlavə et
                                    </Button>
                                </div>

                                {dailyData.breaks && dailyData.breaks.map((brk, idx) => (
                                    <Space key={idx} style={{ display: 'flex' }}>
                                        <TimePicker
                                            size="small"
                                            format="HH:mm"
                                            value={dayjs(brk.break_start, "HH:mm:ss")}
                                            onChange={t => handleBreakChange(idx, "break_start", t ? t.format("HH:mm:ss") : "13:00:00")}
                                        />
                                        <Text>-</Text>
                                        <TimePicker
                                            size="small"
                                            format="HH:mm"
                                            value={dayjs(brk.break_end, "HH:mm:ss")}
                                            onChange={t => handleBreakChange(idx, "break_end", t ? t.format("HH:mm:ss") : "14:00:00")}
                                        />
                                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeBreak(idx)} />
                                    </Space>
                                ))}
                            </>
                        )}
                    </Space>
                )}
            </Modal>
        </Card>
    );
};

const Divider = ({ style }) => <div style={{ height: '1px', background: '#f0f0f0', ...style }} />;

export default CalendarPlanner;
