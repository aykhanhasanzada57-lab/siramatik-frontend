import React from 'react';
import { Form, Input, Checkbox, Button, Typography, Alert } from 'antd';
import { UserOutlined, PhoneOutlined } from '@ant-design/icons';
import styles from '../styles/BookingForm.module.scss';

const { Text } = Typography;

const BookingForm = ({ selectedDate, selectedTime, earlyArrival, onSubmit }) => {
    const [form] = Form.useForm();

    const onFinish = (values) => {
        onSubmit(values); // The API call is handled in the parent component
    };

    return (
        <div className={styles.formContainer}>
            <div className={styles.summaryBox}>
                <Text strong>Tarix: </Text> <Text>{selectedDate}</Text><br />
                <Text strong>Saat: </Text> <Text type="success" strong className={styles.timeHighlight}>{selectedTime}</Text>
            </div>

            <Alert
                message="Vacib Qayda"
                description={`Zəhmət olmasa növbənizin ləğv olunmaması üçün təyin olunmuş vaxtdan ən azı ${earlyArrival || 20} dəqiqə əvvəl (yəni ${calculateArrival(selectedTime, earlyArrival || 20)}) məkanda olmağınız mütləqdir.`}
                type="warning"
                showIcon
                className={styles.alertBox}
            />

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ agree: false }}
            >
                <Form.Item
                    name="name"
                    label="Ad və Soyad"
                    rules={[{ required: true, message: 'Adınızı daxil edin' }]}
                >
                    <Input prefix={<UserOutlined />} placeholder="Məs: Cavid Əliyev" size="large" />
                </Form.Item>

                <Form.Item
                    name="phone"
                    label="Əlaqə Nömrəsi"
                    rules={[{ required: true, message: 'Nömrənizi daxil edin' }]}
                >
                    <Input prefix={<PhoneOutlined />} placeholder="+994 50 123 45 67" size="large" />
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
                        <Text strong type="danger">{earlyArrival || 20} dəqiqə əvvəl gələcəyimi təsdiqləyirəm</Text>
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
