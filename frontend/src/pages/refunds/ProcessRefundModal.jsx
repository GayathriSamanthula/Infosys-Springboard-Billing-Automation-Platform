import React, { useState, useEffect } from 'react';
import { Button, MenuItem } from '@mui/material';
import { useForm } from 'react-hook-form';
import CustomModal from '../../components/common/CustomModal';
import FormInput from '../../components/common/FormInput';
import { invoiceService } from '../../services/invoiceService';
import { useTranslation } from 'react-i18next';

const ProcessRefundModal = ({ open, onClose, onSubmit }) => {
  const { t } = useTranslation();
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
        setInvoices(Array.isArray(list) ? list : []);
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
      title={t('admin.refunds.modal_title', 'Process Customer Refund')}
      actions={
        <>
          <Button onClick={onClose} color="inherit">
            {t('admin.refunds.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleSubmit(handleFormSubmit)} variant="contained" color="warning">
            {t('admin.refunds.submit_refund', 'Process Refund')}
          </Button>
        </>
      }
    >
      <FormInput
        name="invoice_id"
        control={control}
        label={t('admin.refunds.select_invoice', 'Select Paid Invoice')}
        select
        rules={{ required: 'Invoice is required' }}
      >
        {invoices.map((inv) => (
          <MenuItem key={inv.id} value={inv.id}>
            {inv.invoice_number} — #{inv.id} (Total: ₹{inv.amount})
          </MenuItem>
        ))}
      </FormInput>

      <FormInput
        name="reason"
        control={control}
        label={t('admin.refunds.refund_reason_label', 'Refund Reason / Line Item Description')}
        multiline
        rows={2}
        rules={{ required: 'Reason is required' }}
      />
    </CustomModal>
  );
};

export default ProcessRefundModal;
