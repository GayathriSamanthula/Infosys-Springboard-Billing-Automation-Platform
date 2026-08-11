import React, { useState, useEffect } from 'react';
import { Button, MenuItem } from '@mui/material';
import { useForm } from 'react-hook-form';
import CustomModal from '../../components/common/CustomModal';
import FormInput from '../../components/common/FormInput';
import { invoiceService } from '../../services/invoiceService';

const ProcessRefundModal = ({ open, onClose, onSubmit }) => {
  const [invoices, setInvoices] = useState([]);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      invoice_id: '',
      reason: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({ invoice_id: '', reason: '' });
      invoiceService.getAll().then((list) => {
        setInvoices(list);
      });
    }
  }, [open, reset]);

  const handleFormSubmit = (data) => {
    onSubmit({
      invoice_id: Number(data.invoice_id),
      reason: data.reason || 'Customer refund request',
    });
    onClose();
  };

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title="Process Customer Refund (Module 2)"
      actions={
        <>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSubmit(handleFormSubmit)} variant="contained" color="warning">
            Process Refund
          </Button>
        </>
      }
    >
      <FormInput name="invoice_id" control={control} label="Select Paid Invoice" select rules={{ required: 'Invoice is required' }}>
        {invoices.map((inv) => (
          <MenuItem key={inv.id} value={inv.id}>
            {inv.invoice_number} — #{inv.id} (Total: ₹{inv.amount})
          </MenuItem>
        ))}
      </FormInput>

      <FormInput
        name="reason"
        control={control}
        label="Refund Reason / Refund Line Item Description"
        multiline
        rows={2}
        rules={{ required: 'Reason is required' }}
      />
    </CustomModal>
  );
};

export default ProcessRefundModal;
