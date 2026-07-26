import React from 'react';
import { Button, MenuItem } from '@mui/material';
import { useForm } from 'react-hook-form';
import CustomModal from '../../components/common/CustomModal';
import FormInput from '../../components/common/FormInput';
import { BILLING_INTERVALS } from '../../constants/statusTypes';

const PlanFormModal = ({ open, onClose, onSubmit, initialData }) => {
  const isEdit = Boolean(initialData);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: initialData || {
      name: '',
      price: '',
      billing_cycle: 'MONTHLY',
      trial_period_days: 14,
      features: 'Full Billing Suite Access',
      description: '',
    },
  });

  React.useEffect(() => {
    if (open) {
      reset(
        initialData || {
          name: '',
          price: '',
          billing_cycle: 'MONTHLY',
          trial_period_days: 14,
          features: 'Full Billing Suite Access',
          description: '',
        }
      );
    }
  }, [open, initialData, reset]);

  const handleFormSubmit = (data) => {
    onSubmit({
      ...data,
      price: Number(data.price),
      trial_period_days: Number(data.trial_period_days),
    });
    onClose();
  };

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Update Subscription Plan' : 'Create New Subscription Plan'}
      actions={
        <>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSubmit(handleFormSubmit)} variant="contained">
            {isEdit ? 'Save Changes' : 'Create Plan'}
          </Button>
        </>
      }
    >
      <FormInput
        name="name"
        control={control}
        label="Plan Title"
        rules={{ required: 'Plan name is required' }}
      />
      <FormInput
        name="price"
        control={control}
        label="Plan Price (₹)"
        type="number"
        rules={{ required: 'Price is required', min: { value: 0, message: 'Price cannot be negative' } }}
      />
      <FormInput name="billing_cycle" control={control} label="Billing Cycle Interval" select>
        {BILLING_INTERVALS.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </FormInput>
      <FormInput
        name="trial_period_days"
        control={control}
        label="Trial Period (Days)"
        type="number"
        rules={{ min: { value: 0, message: 'Trial days cannot be negative' } }}
      />
      <FormInput
        name="features"
        control={control}
        label="Feature Entitlements"
      />
      <FormInput
        name="description"
        control={control}
        label="Plan Description"
        multiline
        rows={2}
      />
    </CustomModal>
  );
};

export default PlanFormModal;
