import React, { useState, useEffect } from 'react';
import { Button, MenuItem } from '@mui/material';
import { useForm } from 'react-hook-form';
import CustomModal from '../../components/common/CustomModal';
import FormInput from '../../components/common/FormInput';
import { customerService } from '../../services/customerService';
import { planService } from '../../services/planService';

const CreateSubscriptionModal = ({ open, onClose, onSubmit }) => {
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      customer_id: '',
      plan_id: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({ customer_id: '', plan_id: '' });
      Promise.all([customerService.getAll(), planService.getAll()]).then(([cList, pList]) => {
        setCustomers(Array.isArray(cList) ? cList : []);
        setPlans(Array.isArray(pList) ? pList : []);
      });
    }
  }, [open, reset]);

  const handleFormSubmit = (data) => {
    const cust = customers.find((c) => c.id === Number(data.customer_id));
    const plan = plans.find((p) => p.id === Number(data.plan_id));
    onSubmit({
      ...data,
      customer_id: Number(data.customer_id),
      plan_id: Number(data.plan_id),
      customerName: cust?.full_name || '',
      planName: plan?.name || '',
      price: plan?.price || 0,
      trialDays: plan?.trial_period_days || 0,
    });
    onClose();
  };

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title="Create Subscriber Subscription"
      actions={
        <>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSubmit(handleFormSubmit)} variant="contained">
            Activate Subscription
          </Button>
        </>
      }
    >
      <FormInput name="customer_id" control={control} label="Select Customer Account" select rules={{ required: 'Customer is required' }}>
        {customers.map((c) => (
          <MenuItem key={c.id} value={c.id}>
            {c.full_name} ({c.email})
          </MenuItem>
        ))}
      </FormInput>

      <FormInput name="plan_id" control={control} label="Select Subscription Plan" select rules={{ required: 'Plan is required' }}>
        {plans.map((p) => (
          <MenuItem key={p.id} value={p.id}>
            {p.name} — ₹{p.price} / {p.billing_cycle} ({p.trial_period_days}d trial)
          </MenuItem>
        ))}
      </FormInput>
    </CustomModal>
  );
};

export default CreateSubscriptionModal;
