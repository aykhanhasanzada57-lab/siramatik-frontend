import React from 'react';
import { Row, Col, Button, Skeleton, Result } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import styles from '../styles/SlotPicker.module.scss';

const SlotPicker = ({ slots, loading, selectedSlot, onSelect, isAdmin }) => {

    if (loading) {
        return <Skeleton active paragraph={{ rows: 4 }} />;
    }

    if (!slots || slots.length === 0) {
        return (
            <Result
                status="warning"
                title="Sərbəst saat yoxdur"
                subTitle="Bu gün daxilində tamamilə dolu və ya qeyri-iş günüdür. Zəhmət olmasa başqa tarix seçin."
            />
        );
    }

    return (
        <Row gutter={[12, 12]} className={styles.slotGrid}>
            {slots.map((slot, index) => {
                const isAvailable = slot.status === 'available';
                const isSelected = selectedSlot?.time === slot.time;
                const isPast = slot.status === 'past';

                let btnType = "default";
                if (isSelected) btnType = "primary";

                return (
                    <Col xs={8} sm={6} md={8} lg={6} key={index}>
                        <Button
                            type={btnType}
                            block
                            disabled={!isAvailable && !(isAdmin && isPast)}
                            className={`
                                ${styles.slotBtn} 
                                ${!isAvailable && !isPast ? styles.booked : ''}
                                ${isPast ? styles.past : ''}
                            `}
                            onClick={() => (isAvailable || (isAdmin && isPast)) && onSelect(slot)}
                            icon={<ClockCircleOutlined />}
                        >
                            {slot.time}
                        </Button>
                    </Col>
                );
            })}
        </Row>
    );
};

export default SlotPicker;
