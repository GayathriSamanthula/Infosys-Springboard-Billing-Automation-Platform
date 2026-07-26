import React from 'react';
import { TextField } from '@mui/material';
import { Controller } from 'react-hook-form';

const FormInput = ({ name, control, label, defaultValue = '', rules = {}, type = 'text', select = false, children, ...props }) => {
  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      rules={rules}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          {...props}
          type={type}
          label={label}
          select={select}
          error={!!error}
          helperText={error ? error.message : props.helperText}
          fullWidth
          margin="normal"
          variant="outlined"
        >
          {children}
        </TextField>
      )}
    />
  );
};

export default FormInput;
