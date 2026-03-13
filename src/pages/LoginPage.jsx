import React from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { AuthAPI } from '../api';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const LoginPage = () => {
    const navigate = useNavigate();

    const onFinish = async (values) => {
        try {
            message.loading({ content: 'Giriş edilir...', key: 'login' });
            await AuthAPI.login(values);
            message.success({ content: 'Giriş uğurludur!', key: 'login' });
            navigate('/dashboard');
        } catch (err) {
            message.error({ content: err.message || 'Giriş zamanı xəta!', key: 'login' });
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'radial-gradient(at 0% 0%, hsla(225,39%,30%,0.05) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(225,39%,30%,0.05) 0, transparent 50%), #f8fafc'
        }}>
            <Card style={{
                width: '100%',
                maxWidth: 400,
                borderRadius: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
                margin: '0 16px',
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(10px)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px'
                    }}>
                        <Title level={3} style={{ color: '#fff', margin: 0 }}>S</Title>
                    </div>
                    <Title level={3} style={{ margin: 0, fontWeight: 700 }}>Admin Girişi</Title>
                    <Typography.Text type="secondary">SiraMatik idarəetmə panelinə xoş gəldiniz</Typography.Text>
                </div>
                <Form layout="vertical" onFinish={onFinish} size="large">
                    <Form.Item name="email" label="E-poçt" rules={[{ required: true, message: 'E-poçtunuzu daxil edin!' }]}>
                        <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="aydin@siramatik.com" style={{ borderRadius: '12px' }} />
                    </Form.Item>
                    <Form.Item name="password" label="Parol" rules={[{ required: true, message: 'Parolunuzu daxil edin!' }]}>
                        <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="••••••••" style={{ borderRadius: '12px' }} />
                    </Form.Item>
                    <Form.Item style={{ marginTop: '32px', marginBottom: '8px' }}>
                        <Button type="primary" htmlType="submit" block style={{ height: '54px', borderRadius: '12px', fontSize: '16px', fontWeight: '600', background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)', border: 'none' }}>
                            Daxil ol
                        </Button>
                    </Form.Item>
                    <Button 
                        type="text" 
                        block 
                        icon={<ArrowLeftOutlined />} 
                        onClick={() => navigate('/berber-aydin')}
                        style={{ height: '40px', color: '#64748b', fontSize: '14px' }}
                    >
                        Sifariş səhifəsinə qayıt
                    </Button>
                </Form>
            </Card>
        </div>
    );
};

export default LoginPage;
