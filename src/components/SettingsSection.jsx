import React, { useState, useEffect } from 'react';
import { Form, TimePicker, InputNumber, Checkbox, Button, Space, Typography, Card, Spin, App, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { ProviderAPI } from '../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const SettingsSection = () => {
    const { message } = App.useApp();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [schedule, setSchedule] = useState([]);
    const [settings, setSettings] = useState(null);

    const weekDays = {
        1: 'Bazar ertəsi',
        2: 'Çərşənbə axşamı',
        3: 'Çərşənbə',
        4: 'Cümə axşamı',
        5: 'Cümə',
        6: 'Şənbə',
        7: 'Bazar'
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [schedRes, settingsRes] = await Promise.all([
                ProviderAPI.getMySchedule(),
                ProviderAPI.getMyDetails()
            ]);
            setSchedule(schedRes.data);
            setSettings(settingsRes.data.settings);
        } catch (err) {
            message.error("Məlumatları yükləyərkən xəta: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const onSaveAll = async (values) => {
        try {
            setSaving(true);

            // 1. Update Schedule
            const schedulePayload = schedule.map(day => ({
                day_of_week: day.day_of_week,
                start_time: day.start_time,
                end_time: day.end_time,
                slot_interval: day.slot_interval,
                is_active: day.is_active,
                breaks: day.breaks.map(b => ({
                    break_start: b.break_start,
                    break_end: b.break_end
                }))
            }));

            await ProviderAPI.updateMySchedule({ days: schedulePayload });

            // 2. Update Settings
            await ProviderAPI.updateMySettings({
                max_advance_days: values.max_advance_days,
                early_arrival_minutes: values.early_arrival_minutes
            });

            message.success("Bütün tənzimləmələr yadda saxlanıldı!");
        } catch (err) {
            message.error("Xəta baş verdi: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDayChange = (dayOfWeek, field, value) => {
        setSchedule(prev => prev.map(day =>
            day.day_of_week === dayOfWeek ? { ...day, [field]: value } : day
        ));
    };

    const addBreak = (dayOfWeek) => {
        setSchedule(prev => prev.map(day =>
            day.day_of_week === dayOfWeek
                ? { ...day, breaks: [...day.breaks, { break_start: '13:00:00', break_end: '14:00:00' }] }
                : day
        ));
    };

    const removeBreak = (dayOfWeek, index) => {
        setSchedule(prev => prev.map(day =>
            day.day_of_week === dayOfWeek
                ? { ...day, breaks: day.breaks.filter((_, i) => i !== index) }
                : day
        ));
    };

    const handleBreakChange = (dayOfWeek, index, field, value) => {
        setSchedule(prev => prev.map(day =>
            day.day_of_week === dayOfWeek
                ? { ...day, breaks: day.breaks.map((b, i) => i === index ? { ...b, [field]: value } : b) }
                : day
        ));
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>;

    return (
        <Card>
            <Form layout="vertical" onFinish={onSaveAll} initialValues={settings}>
                <Title level={4}>Ümumi Tənzimləmələr</Title>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '32px' }}>
                    <Form.Item name="max_advance_days" label="Neçə gün öncədən növbə götürmək olar?">
                        <InputNumber min={1} max={30} />
                    </Form.Item>
                    <Form.Item name="early_arrival_minutes" label="Müştəri neçə dəqiqə tez gəlməlidir?">
                        <InputNumber min={0} max={60} />
                    </Form.Item>
                </div>

                <Title level={4}>Həftəlik İş Qrafiki, İnterval və Fasilə (Obed)</Title>
                <div style={{ marginBottom: '24px' }}>
                    {schedule.map(day => (
                        <div key={day.day_of_week} style={{
                            padding: '20px',
                            borderBottom: '1px solid #f0f0f0',
                            background: day.is_active ? '#fff' : '#fafafa',
                            marginBottom: '10px',
                            borderRadius: '8px',
                            border: '1px solid #f0f0f0'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                                <div style={{ width: '130px' }}>
                                    <Checkbox
                                        checked={day.is_active}
                                        onChange={(e) => handleDayChange(day.day_of_week, 'is_active', e.target.checked)}
                                    >
                                        <Text strong>{weekDays[day.day_of_week]}</Text>
                                    </Checkbox>
                                </div>

                                <Space>
                                    <Text type="secondary">İş saatları:</Text>
                                    <TimePicker
                                        format="HH:mm"
                                        value={day.is_active ? dayjs(day.start_time, 'HH:mm:ss') : null}
                                        disabled={!day.is_active}
                                        onChange={(time) => handleDayChange(day.day_of_week, 'start_time', time ? time.format('HH:mm:ss') : '09:00:00')}
                                    />
                                    <Text>-</Text>
                                    <TimePicker
                                        format="HH:mm"
                                        value={day.is_active ? dayjs(day.end_time, 'HH:mm:ss') : null}
                                        disabled={!day.is_active}
                                        onChange={(time) => handleDayChange(day.day_of_week, 'end_time', time ? time.format('HH:mm:ss') : '18:00:00')}
                                    />
                                </Space>

                                <div>
                                    <Text type="secondary">İnterval (dəq):</Text>
                                    <InputNumber
                                        min={5}
                                        max={240}
                                        value={day.slot_interval}
                                        disabled={!day.is_active}
                                        onChange={(val) => handleDayChange(day.day_of_week, 'slot_interval', val)}
                                        style={{ marginLeft: '10px', width: '60px' }}
                                    />
                                </div>
                            </div>

                            {day.is_active && (
                                <div style={{ marginLeft: '130px', padding: '10px', background: '#f9f9f9', borderRadius: '4px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <Text strong size="small">Fasilələr (Obed vaxdı):</Text>
                                        <Button
                                            type="dashed"
                                            size="small"
                                            icon={<PlusOutlined />}
                                            onClick={() => addBreak(day.day_of_week)}
                                        >
                                            Fasilə əlavə et
                                        </Button>
                                    </div>

                                    {day.breaks && day.breaks.length > 0 ? (
                                        day.breaks.map((brk, index) => (
                                            <Space key={index} style={{ display: 'flex', marginBottom: '8px' }}>
                                                <TimePicker
                                                    size="small"
                                                    format="HH:mm"
                                                    value={dayjs(brk.break_start, 'HH:mm:ss')}
                                                    onChange={(time) => handleBreakChange(day.day_of_week, index, 'break_start', time ? time.format('HH:mm:ss') : '13:00:00')}
                                                />
                                                <Text>-</Text>
                                                <TimePicker
                                                    size="small"
                                                    format="HH:mm"
                                                    value={dayjs(brk.break_end, 'HH:mm:ss')}
                                                    onChange={(time) => handleBreakChange(day.day_of_week, index, 'break_end', time ? time.format('HH:mm:ss') : '14:00:00')}
                                                />
                                                <Button
                                                    type="text"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    onClick={() => removeBreak(day.day_of_week, index)}
                                                />
                                            </Space>
                                        ))
                                    ) : (
                                        <Text type="secondary" style={{ fontSize: '12px' }}>Fasilə təyin olunmayıb</Text>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <Form.Item>
                    <Button type="primary" htmlType="submit" size="large" loading={saving} block>
                        Yadda Saxla
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default SettingsSection;
