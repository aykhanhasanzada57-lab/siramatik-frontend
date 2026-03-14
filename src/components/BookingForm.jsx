import React from 'react';
import { Form, Input, Checkbox, Button, Typography, Alert, Select, Space } from 'antd';
import { UserOutlined, PhoneOutlined } from '@ant-design/icons';
import styles from '../styles/BookingForm.module.scss';

const { Text } = Typography;

const BookingForm = ({ selectedDate, selectedTime, earlyArrival, onSubmit }) => {
    const [form] = Form.useForm();

    const onFinish = (values) => {
        // Combine prefix and phone number
        const formattedPhone = `${values.prefix} ${values.phone_number}`;
        onSubmit({
            ...values,
            phone: formattedPhone
        });
    };

    const handlePhoneChange = (e) => {
        const { value } = e.target;
        // Allow only digits and dashes
        const cleanValue = value.replace(/[^\d]/g, '');
        
        // Limit to 7 digits
        const limitedValue = cleanValue.substring(0, 7);
        
        // Apply mask: 123-45-67
        let formatted = limitedValue;
        if (limitedValue.length > 3 && limitedValue.length <= 5) {
            formatted = `${limitedValue.slice(0, 3)}-${limitedValue.slice(3)}`;
        } else if (limitedValue.length > 5) {
            formatted = `${limitedValue.slice(0, 3)}-${limitedValue.slice(3, 5)}-${limitedValue.slice(5)}`;
        }

        form.setFieldsValue({ phone_number: formatted });
    };

    return (
        <div className={styles.formContainer}>
            <div className={styles.summaryBox}>
                <Text strong>Tarix: </Text> <Text>{selectedDate}</Text><br />
                <Text strong>Saat: </Text> <Text type="success" strong className={styles.timeHighlight}>{selectedTime}</Text>
            </div>

            <Alert
                title="Vacib Qayda"
                description={`Zəhmət olmasa növbənizin ləğv olunmaması üçün təyin olunmuş vaxtdan ən azı ${earlyArrival !== undefined ? earlyArrival : 20} dəqiqə əvvəl (yəni ${calculateArrival(selectedTime, earlyArrival !== undefined ? earlyArrival : 20)}) məkanda olmağınız mütləqdir.`}
                type="warning"
                showIcon
                className={styles.alertBox}
            />

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ agree: false, prefix: '050' }}
            >
                <Form.Item
                    name="name"
                    label="Ad və Soyad"
                    rules={[{ required: true, message: 'Adınızı daxil edin' }]}
                >
                    <Input prefix={<UserOutlined />} placeholder="Məs: Cavid Əliyev" size="large" />
                </Form.Item>

                <Form.Item label="Əlaqə Nömrəsi" required>
                    <Space.Compact style={{ width: '100%' }}>
                        <Form.Item
                            name="prefix"
                            noStyle
                        >
                            <Select 
                                style={{ width: '85px' }} 
                                size="large" 
                                styles={{ popup: { root: { zIndex: 2000 } } }}
                            >
                                <Select.Option value="050">050</Select.Option>
                                <Select.Option value="051">051</Select.Option>
                                <Select.Option value="055">055</Select.Option>
                                <Select.Option value="070">070</Select.Option>
                                <Select.Option value="077">077</Select.Option>
                                <Select.Option value="099">099</Select.Option>
                                <Select.Option value="010">010</Select.Option>
                            </Select>
                        </Form.Item>
                        <Form.Item
                            name="phone_number"
                            noStyle
                            rules={[
                                { required: true, message: 'Nömrənizi daxil edin' },
                                { pattern: /^\d{3}-\d{2}-\d{2}$/, message: 'Format düzgün deyil (Məs: 123-45-67)' }
                            ]}
                        >
                            <Input 
                                placeholder="123-45-67" 
                                size="large" 
                                onChange={handlePhoneChange}
                                maxLength={9} // 7 digits + 2 dashes
                            />
                        </Form.Item>
                    </Space.Compact>
                </Form.Item>

                <Form.Item
                    name="agree"
                    valuePropName="checked"
                    rules={[
                        {
                            validator: (_, value) =>
                                value ? Promise.resolve() : Promise.reject(new Error('Qaydalarla razılaşmalısınız')),
                        },
                    ]}
                >
                    <Checkbox>
                        <Text strong type="danger">{earlyArrival !== undefined ? earlyArrival : 20} dəqiqə əvvəl gələcəyimi təsdiqləyirəm</Text>
                    </Checkbox>
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" size="large" block className={styles.submitBtn}>
                        Təsdiqlə
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

// Helper function to calculate 'must arrive by' time
function calculateArrival(timeStr, earlyMinutes) {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    let dateObj = new Date(2000, 0, 1, hours, minutes);
    dateObj.setMinutes(dateObj.getMinutes() - earlyMinutes);

    return String(dateObj.getHours()).padStart(2, '0') + ':' + String(dateObj.getMinutes()).padStart(2, '0');
}

export default BookingForm;
