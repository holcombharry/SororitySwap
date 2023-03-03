import React, { useRef } from 'react';
import { bool, func, number, string } from 'prop-types';
import { Form as FinalForm, FormSpy } from 'react-final-form';

import config from '../../../config';
import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import { numberAtLeast, required } from '../../../util/validators';

import {
  Form,
  FieldSelect,
  FieldTextInput,
  InlineTextButton,
  PrimaryButton,
} from '../../../components';

import EstimatedCustomerBreakdownMaybe from '../EstimatedCustomerBreakdownMaybe';

import css from './ProductOrderForm.module.css';

const renderForm = formRenderProps => {
  const {
    // FormRenderProps from final-form
    handleSubmit,
    form: formApi,

    // Custom props passed to the form component
    intl,
    formId,
    currentStock,
    hasMultipleDeliveryMethods,
    listingId,
    isOwnListing,
    onFetchTransactionLineItems,
    onContactUser,
    lineItems,
    fetchLineItemsInProgress,
    fetchLineItemsError,
    values,
    testSubmitDisabledProp,
    publicData,
    customConfig,
  } = formRenderProps;

  const { listing, filters } = customConfig || {};


  const pickExtendedData = filterConfig => (rows, key) => {
    const publicDataValue = publicData[key];
    if (publicDataValue) {
      const filterIfItExists = filterConfig.find(f => f.id === key);
      const filterOptions = filterIfItExists?.config?.options || [];
      const value = filterOptions.find(o => o.key === publicDataValue)?.label || publicDataValue;
      const label = filterIfItExists?.label || `${key.charAt(0).toUpperCase()}${key.slice(1)}`;

      return rows.concat({ key, value, label });
    }
    return rows;
  };

  const existingExtendedData = listing?.enumFieldDetails.reduce(pickExtendedData(filters), []);


  function camelToLabel(value) {
    if(value.length !== 0 && value.length > 0) {
      var str = '';
      str += value.charAt(0).toUpperCase();
      var i = 1;
      while(i < value.length) {
        if(value.charAt(i) == value.charAt(i).toUpperCase()) {
          str += ' ';
        }
        str += value.charAt(i);
        i++;
      }
    }
    return str;
  }

  function arrayToCamelCase(value) {
    var arr = [];
    value.map(option => {
      arr.push(camelToLabel(option));
    })
    return arr;
  }

  function isMadeToOrder(extendedData) {
    for(let i = 0; i < extendedData.length; i++) {
      if(extendedData[i].key == "madetoorder") {
        if(extendedData[i].value == "Yes") {
          return true;
        } else {
          return false;
        }
      }
    }
    return false;
  }

  const handleOnChange = formValues => {
    const { quantity: quantityRaw, deliveryMethod } = formValues.values;
    const quantity = Number.parseInt(quantityRaw, 10);
    const isBrowser = typeof window !== 'undefined';
    if (isBrowser && quantity && deliveryMethod && !fetchLineItemsInProgress) {
      onFetchTransactionLineItems({
        orderData: { quantity, deliveryMethod },
        listingId,
        isOwnListing,
      });
    }
  };

  // In case quantity and deliveryMethod are missing focus on that select-input.
  // Otherwise continue with the default handleSubmit function.
  const handleFormSubmit = e => {
    
    const { quantity, deliveryMethod } = values || {};
    if (!quantity || quantity < 1) {
      e.preventDefault();
      // Blur event will show validator message
      formApi.blur('quantity'); // TODO:
      formApi.focus('quantity');
    } else if (!deliveryMethod) {
      e.preventDefault();
      // Blur event will show validator message
      formApi.blur('deliveryMethod');
      formApi.focus('deliveryMethod');
    } else {
      handleSubmit(e);
    }
  };

  const breakdownData = {};
  const showBreakdown =
    breakdownData && lineItems && !fetchLineItemsInProgress && !fetchLineItemsError;
  const breakdown = showBreakdown ? (
    <div className={css.breakdownWrapper}>
      <h3>
        <FormattedMessage id="ProductOrderForm.breakdownTitle" />
      </h3>
      <EstimatedCustomerBreakdownMaybe
        unitType={config.lineItemUnitType}
        breakdownData={breakdownData}
        lineItems={lineItems}
      />
    </div>
  ) : null;

  const showContactUser = typeof onContactUser === 'function';

  const onClickContactUser = e => {
    e.preventDefault();
    onContactUser();
  };

  const contactSellerLink = (
    <InlineTextButton onClick={onClickContactUser}>
      <FormattedMessage id="ProductOrderForm.finePrintNoStockLinkText" />
    </InlineTextButton>
  );
  const quantityRequiredMsg = intl.formatMessage({ id: 'ProductOrderForm.quantityRequired' });

  const selectionRequiredMsg = intl.formatMessage({ id: 'ProductOrderForm.selectionRequired' });

  const hasStock = currentStock && currentStock > 0;
  const quantities = hasStock ? [...Array(currentStock).keys()].map(i => i + 1) : [];
  const hasNoStockLeft = typeof currentStock != null && currentStock === 0;
  const hasOneItemLeft = typeof currentStock != null && currentStock === 1;

  const submitInProgress = fetchLineItemsInProgress;
  const submitDisabled = !hasStock;

  return (
    <Form onSubmit={handleFormSubmit}>
      <FormSpy subscription={{ values: true }} onChange={handleOnChange} />
      {hasNoStockLeft ? null : hasOneItemLeft ? (
        <FieldTextInput
          id={`${formId}.quantity`}
          className={css.quantityField}
          name="quantity"
          type="hidden"
          validate={numberAtLeast(quantityRequiredMsg, 1)}
        />
      ) : (
        <FieldSelect
          id={`${formId}.quantity`}
          className={css.quantityField}
          name="quantity"
          disabled={!hasStock}
          label={intl.formatMessage({ id: 'ProductOrderForm.quantityLabel' })}
          validate={numberAtLeast(selectionRequiredMsg, 1)}
        >
          <option disabled value="">
            {intl.formatMessage({ id: 'ProductOrderForm.selectQuantityOption' })}
          </option>
          {quantities.map(quantity => (
            <option key={quantity} value={quantity}>
              {intl.formatMessage({ id: 'ProductOrderForm.quantityOption' }, { quantity })}
            </option>
          ))}
        </FieldSelect>
      )}
      {isMadeToOrder(existingExtendedData) ? 
        existingExtendedData.map(detail => (Array.isArray(detail.value) ? 
        <FieldSelect
          id={`${formId}.` + detail.key}
          className={css.quantityField}
          name={detail.key}
          disabled={detail.value.length == 0}
          label={detail.label}
          validate={required(selectionRequiredMsg)} // TODO: Not sure about this validate
        >
          <option disabled value="">
            {detail.value.length > 0 ? "Select " + detail.label : "No " + detail.label + " options available"}

          </option>
          {detail.value.map(value => (
            <option key={value} value={value}>
              {camelToLabel(value)}
            </option>
          ))}
        </FieldSelect> : null
      ))
      : null}
      {hasNoStockLeft ? null : hasMultipleDeliveryMethods ? (
        <FieldSelect
          id={`${formId}.deliveryMethod`}
          className={css.deliveryField}
          name="deliveryMethod"
          disabled={!hasStock}
          label={intl.formatMessage({ id: 'ProductOrderForm.deliveryMethodLabel' })}
          validate={required(intl.formatMessage({ id: 'ProductOrderForm.deliveryMethodRequired' }))}
        >
          <option disabled value="">
            {intl.formatMessage({ id: 'ProductOrderForm.selectDeliveryMethodOption' })}
          </option>
          <option value={'pickup'}>
            {intl.formatMessage({ id: 'ProductOrderForm.pickupOption' })}
          </option>
          <option value={'shipping'}>
            {intl.formatMessage({ id: 'ProductOrderForm.shippingOption' })}
          </option>
        </FieldSelect>
      ) : (
        <div className={css.deliveryField}>
          <label>{intl.formatMessage({ id: 'ProductOrderForm.deliveryMethodLabel' })}</label>
          <p className={css.singleDeliveryMethodSelected}>
            {values.deliveryMethod === 'shipping'
              ? intl.formatMessage({ id: 'ProductOrderForm.shippingOption' })
              : intl.formatMessage({ id: 'ProductOrderForm.pickupOption' })}
          </p>
          <FieldTextInput
            id={`${formId}.deliveryMethod`}
            className={css.deliveryField}
            name="deliveryMethod"
            type="hidden"
          />
        </div>
      )}
      {breakdown}
      <div className={css.submitButton}>
        <PrimaryButton type="submit" inProgress={submitInProgress} disabled={submitDisabled}>
          {hasStock ? (
            <FormattedMessage id="ProductOrderForm.ctaButton" />
          ) : (
            <FormattedMessage id="ProductOrderForm.ctaButtonNoStock" />
          )}
        </PrimaryButton>
      </div>
      <p className={css.finePrint}>
        {hasStock ? (
          <FormattedMessage id="ProductOrderForm.finePrint" />
        ) : showContactUser ? (
          <FormattedMessage id="ProductOrderForm.finePrintNoStock" values={{ contactSellerLink }} />
        ) : null}
      </p>
    </Form>
  );
};

const ProductOrderForm = props => {
  const intl = useIntl();
  const { price, currentStock, pickupEnabled, shippingEnabled } = props;

  // Should not happen for listings that go through EditListingWizard.
  // However, this might happen for imported listings.
  if (!pickupEnabled && !shippingEnabled) {
    return (
      <p className={css.error}>
        <FormattedMessage id="ProductOrderForm.noDeliveryMethodSet" />
      </p>
    );
  }

  if (!price) {
    return (
      <p className={css.error}>
        <FormattedMessage id="ProductOrderForm.listingPriceMissing" />
      </p>
    );
  }
  if (price.currency !== config.currency) {
    return (
      <p className={css.error}>
        <FormattedMessage id="ProductOrderForm.listingCurrencyInvalid" />
      </p>
    );
  }
  const hasOneItemLeft = currentStock && currentStock === 1;
  const quantityMaybe = hasOneItemLeft ? { quantity: '1' } : {};
  const singleDeliveryMethodAvailableMaybe =
    shippingEnabled && !pickupEnabled
      ? { deliveryMethod: 'shipping' }
      : !shippingEnabled && pickupEnabled
      ? { deliveryMethod: 'pickup' }
      : {};
  const hasMultipleDeliveryMethods = pickupEnabled && shippingEnabled;
  const initialValues = { ...quantityMaybe, ...singleDeliveryMethodAvailableMaybe };

  return (
    <FinalForm
      initialValues={initialValues}
      hasMultipleDeliveryMethods={hasMultipleDeliveryMethods}
      {...props}
      intl={intl}
      render={renderForm}
    />
  );
};

ProductOrderForm.defaultProps = {
  rootClassName: null,
  className: null,
  price: null,
  currentStock: null,
  listingId: null,
  isOwnListing: false,
  lineItems: null,
  fetchLineItemsError: null,
};

ProductOrderForm.propTypes = {
  rootClassName: string,
  className: string,

  // form
  formId: string.isRequired,
  onSubmit: func.isRequired,

  // listing
  listingId: propTypes.uuid,
  price: propTypes.money,
  currentStock: number,
  isOwnListing: bool,

  // line items
  lineItems: propTypes.lineItems,
  onFetchTransactionLineItems: func.isRequired,
  fetchLineItemsInProgress: bool.isRequired,
  fetchLineItemsError: propTypes.error,

  // other
  onContactUser: func,
};

export default ProductOrderForm;
