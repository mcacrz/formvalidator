export default class FormValidator {
  /**
   *
   * @returns
   */
  formValidator () {
    const inputsToValidateArray = this.getInputArray()

    const validateResultsArray = this.formAssertions(inputsToValidateArray)

    return (validateResultsArray.length === 0)
  }

  /**
   * Return all form errors
   */
  formErrors () {
    const inputFieldsArray = this.getInputArray()
    const validateResultsArray = this.formAssertions(inputFieldsArray)

    return (validateResultsArray.length === 0)
      ? null
      : validateResultsArray
  }

  /**
   *
   * @param {*} field
   * @returns
   */
  assertionParser (field) {
    const RULES = [
      { rule: /atLeast\([0-9]*\)/gi, action: this.atLeast.bind(this) },
      { rule: /(cpf)|(true|false)/gi, action: this.cpf.bind(this) },
      { rule: /email/gi, action: this.email.bind(this) },
      { rule: /required/gi, action: this.required.bind(this) },
      { rule: /max\([0-9]*\)/gi, action: this.max.bind(this) },
      { rule: /min\([0-9]*\)/gi, action: this.min.bind(this) }
    ]

    const inputRulesArray = field.getAttribute('fv-rules').split('|')

    const inputFormAssertions = inputRulesArray
      .map(ruleName => {
        const resultAssertions = RULES
          .map(ruleObj =>
            (
              ruleName.match(ruleObj.rule) === null ||
          field.type === 'button' || field.type === 'submit' || field.type === 'reset'
            )
              ? null
              : ruleObj.action(field, ruleName)
          )
          .filter(inputsFormAssertionsMap => inputsFormAssertionsMap !== null)

        return resultAssertions
      })
      .filter(mapFieldInput => mapFieldInput[0].status !== true && mapFieldInput[0] !== null)

    return inputFormAssertions
  }

  /**
   *
   * @param {*} field
   * @param {*} getIdentityFrom
   * @returns
   */
  getFieldValue (field, getIdentityFrom) {
    let result = false
    let identity = ''

    getIdentityFrom = getIdentityFrom || null

    switch (getIdentityFrom) {
      case 'name':
        identity = 'input[name="' + field.name + '"]'
        break
      case 'id':
        identity = '#' + field.id
        break
      default:
        identity = '#' + field.id
        break
    }

    switch (field.type) {
      case 'text':
      case 'email': {
        return field.value
      }
      case 'checkbox': {
        const checkboxesNodes = document.querySelectorAll(identity)
        const checkboxes = [...checkboxesNodes]
        result = checkboxes
          .map(checkbox => checkbox.checked)
          .filter(item => item === true)
        return result
      }
      case 'radio': {
        const radioButtonList = document.querySelectorAll(identity)
        const radioButtonArray = [...radioButtonList]
        result = radioButtonArray
          .map(radio => radio.checked)
          .filter(radio => radio === true)
        return result
      }
    }
  }

  /**
   *
   * @returns
   */
  getInputArray () {
    const inputsFormNodes = document.querySelectorAll('.fvfield')
    const inputsFormArray = [...inputsFormNodes]
    return inputsFormArray
  }

  /**
   *
   * @param {*} inputsFormArray
   * @returns
   */
  formAssertions (inputsFormArray) {
    return inputsFormArray.map((field) => {
      return this.assertionParser(field)
    })
      .filter(assertionsArray => assertionsArray.length > 0)
  }

  /**
  * Rule to assert if at least the mimimum number of checkboxes or radioButton were checked.
  * Get the identity from field by name
  * @param {object} field // input Field from form
  * @param {string} ruleName // name of the rule put in input form field
  * @returns {object} json with the status, field name and rule tested
  */
  atLeast (field, ruleName) {
    field = field || null

    if (field === null || ruleName === null) return { status: false, fieldName: 'none', ruleName: 'none' }

    const val = this.getFieldValue(field, 'name')

    const atLeastValue = ruleName.match(/([0-9]*)/gi).join(',').replace(/,/gi, '')

    return (val.length >= parseInt(atLeastValue))
      ? { status: true }
      : { status: false, fieldName: field.id, rule: ruleName }
  }

  /**
   *
   * @param {*} field
   * @param {*} ruleName
   * @returns
   */
  cpf (field, ruleName) {
    field = field || null

    if (field === null || ruleName === null) return { status: false, fieldName: 'none', ruleName: 'none' }

    const [, punctuationMatch] = ruleName.match(/(cpf)|(true|false)/gi)
    const punctuationEnabled = Boolean(punctuationMatch !== undefined && punctuationMatch.length > 0 && punctuationMatch.toLowerCase() === 'true' ? punctuationMatch : '')

    const val = this.getFieldValue(field)

    const cpfPatternWithoutPunctuation = /^\d{11}$/
    const cpfPatternWithPunctuation = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/

    if (punctuationEnabled) {
      return (val.match(cpfPatternWithPunctuation))
        ? { status: true }
        : { status: false, fieldName: field.id, rule: ruleName }
    }

    if (!punctuationEnabled) {
      return (val.match(cpfPatternWithoutPunctuation))
        ? { status: true }
        : { status: false, fieldName: field.id, rule: ruleName }
    }
  }

  /**
   * Rule to assert if the email is fill correctly
   * @param {object} field //input field from Form
   * @param {*} ruleName // name of the rule put in input form field
   * @returns {object} json with the status, field name and rule tested
   */
  email (field, ruleName) {
    field = field || null

    if (field === null || ruleName === null) return { status: false, fieldName: 'none', ruleName: 'none' }

    const val = this.getFieldValue(field)

    const emailPattern = /^([\w._\-!#$%&'*+/=?^`{|}~]*)+@+([\w._\-!#$%&'*+/=?^`{|}~]*)+\.([a-zA-Z]{2,3})+(\.[a-zA-Z]{2})?$/gi

    return (val.match(emailPattern))
      ? { status: true }
      : { status: false, fieldName: field.id, rule: ruleName }
  }

  /**
   * Rule for assert if the value of field is equal or less than maximum value informed
   * @param {object} field // input Field from form
   * @param {string} ruleName // name of the rule put in input form field
   * @returns {object} json with the status, field name and rule tested
   */
  max (field, ruleName) {
    field = field || null
    ruleName = ruleName || null

    if (field === null || ruleName === null) return { status: false, fieldName: 'none', ruleName: 'none' }

    const maxValue = ruleName.match(/([0-9]*)/gi).join(',').replace(/,/gi, '')

    const val = this.getFieldValue(field)

    return (val.length > parseInt(maxValue))
      ? { status: false, fieldName: field.id, rule: ruleName }
      : { status: true }
  }

  /**
   * Rule for assert if the value of field is equal or greather than minimum value informed
   * @param {object} field // input Field from form
   * @param {string} ruleName // name of the rule put in input form field
   * @returns {object} json with the status, field name and rule tested
   */
  min (field, ruleName) {
    field = field || null

    if (field === null || ruleName === null) return { status: false, fieldName: 'none', ruleName: 'none' }

    const minValue = ruleName.match(/([0-9]*)/gi).join(',').replace(/,/gi, '')

    const val = this.getFieldValue(field)

    return (val.length < parseInt(minValue))
      ? { status: false, fieldName: field.id, rule: ruleName }
      : { status: true }
  }

  /**
   * Rule for assert if the value of field is filled or checked (true) or empty (false);
   * Get the identity from field by id
   * @param {object} field // input Field from form
   * @param {string} ruleName // name of the rule put in input form field
   * @returns {object} json with the status, field name and rule tested
   */
  required (field, ruleName) {
    field = field || null

    if (field === null || ruleName === null) return { status: false, fieldName: 'none', ruleName: 'none' }

    const val = this.getFieldValue(field, 'id')

    return (val === null)
      ? null
      : (val.length > 0)
          ? { status: true }
          : { status: false, fieldName: field.id, rule: ruleName }
  }
}
