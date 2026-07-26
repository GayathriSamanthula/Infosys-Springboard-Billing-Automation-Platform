import React from 'react';
import { Button, MenuItem } from '@mui/material';
import { useForm } from 'react-hook-form';
import CustomModal from '../../components/common/CustomModal';
import FormInput from '../../components/common/FormInput';
import { EMAIL_REGEX, PHONE_REGEX } from '../../utils/validators';

const CustomerFormModal = ({ open, onClose, onSubmit, initialData }) => {
  const isEdit = Boolean(initialData);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: initialData || {
      full_name: '',
      email: '',
      phone_number: '',
      country: 'India',
      address: '',
      customer_status: 'ACTIVE',
    },
  });

  React.useEffect(() => {
    if (open) {
      reset(initialData || { full_name: '', email: '', phone_number: '', country: 'India', address: '', customer_status: 'ACTIVE' });
    }
  }, [open, initialData, reset]);

  const handleFormSubmit = (data) => {
    onSubmit(data);
    onClose();
  };

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Customer Account' : 'Create New Customer'}
      actions={
        <>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSubmit(handleFormSubmit)} variant="contained">
            {isEdit ? 'Save Changes' : 'Create Customer'}
          </Button>
        </>
      }
    >
      <FormInput
        name="full_name"
        control={control}
        label="Customer Full Name / Company"
        rules={{ required: 'Customer name is required' }}
      />
      <FormInput
        name="email"
        control={control}
        label="Billing Email Address"
        rules={{
          required: 'Email is required',
          pattern: { value: EMAIL_REGEX, message: 'Enter a valid email address' },
        }}
      />
      <FormInput
        name="phone_number"
        control={control}
        label="Contact Phone Number"
        rules={{
          required: 'Phone number is required',
          pattern: { value: PHONE_REGEX, message: 'Enter a valid phone number' },
        }}
      />
      <FormInput
        name="country"
        control={control}
        label="Country / Region"
        rules={{ required: 'Country is required' }}
      />
      {isEdit && (
        <FormInput name="customer_status" control={control} label="Account Status" select>
          <MenuItem value="ACTIVE">Active</MenuItem>
          <MenuItem value="INACTIVE">Inactive</MenuItem>
        </FormInput>
      )}
    </CustomModal>
  );
};

export default CustomerFormModal;
