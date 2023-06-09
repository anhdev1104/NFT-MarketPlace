// Đối tượng `validator`
function Validator(options) { 
    const selectorRules = {};

    // Hàm thực hiện validate
    function validate(inputElement, rule) {
        const errorElement = inputElement.closest(options.formGroupSelector).querySelector(options.errorSelector);
        let errorMessage;

        // Lấy ra các rules của selector
        const rules = selectorRules[rule.selector];
        // Lặp qua từng rule & kiểm tra
        // Nếu có lỗi thì dừng việc kiểm tra
        for (let i = 0; i < rules.length; ++i) {
            switch (inputElement.type) {
                case 'radio':
                case 'checkbox':
                    errorMessage = rules[i](
                        formElement.querySelector(rule.selector + ':checked')
                    );
                    break;
                default:
                    errorMessage = rules[i](inputElement.value);
            }
            if (errorMessage) break;
        }

        if (errorMessage) {
            errorElement.innerText = errorMessage;
            inputElement.closest(options.formGroupSelector).classList.add('invalid');
        } else {
            errorElement.innerText = '';
            inputElement.closest(options.formGroupSelector).classList.remove('invalid');
        }
        return errorMessage;
    }

    // Lấy element của form cần validate
    const formElement = document.querySelector(options.form);
    if (formElement) {
        // Khi submit form
        formElement.onsubmit = function (e) {
            e.preventDefault();

            let isFormvalid = false;

            // Lặp qua từng rules và validate
            options.rules.forEach((rule) => {
                const inputElement = formElement.querySelector(rule.selector);
                const isValid = validate(inputElement, rule);
                if (isValid) {
                    isFormvalid = true;
                }
            });

            // Khi không có lỗi
            if (!isFormvalid) {
                // Trường hợp submit với JavaScript
                if (typeof options.onSubmit === 'function') {
                    const enableInputs = formElement.querySelectorAll('[name]:not([disabled])');
                    // Cover từ nodeLists sang Array
                    const formValues = Array.from(enableInputs).reduce(function (values, input) {
                        switch (input.type) {
                            case 'radio':
                                if (input.checked) {
                                    values[input.name] = input.value;
                                }
                                if (!values[input.name]) {
                                    values[input.name] = '';
                                }
                                break;
                            case 'checkbox':
                                if (!input.checked) return values;
                                if (!values[input.name]) {
                                    values[input.name] = '';
                                }
                                if (!Array.isArray(values[input.name])) {
                                    values[input.name] = [];
                                }
                                values[input.name].push(input.value);
                                break;
                            case 'file': 
                                values[input.name] = input.files;
                                break;
                            default:
                                values[input.name] = input.value;
                        }
                        return values;
                    }, {});

                    options.onSubmit(formValues);
                }
                // Trường hợp submit với hành vi mặc định
                else {
                    formElement.submit();
                }
                toast(toastSuccess);
            } else {
                toast(toastError);
            }
        }

        // Toast success
        // Xử lí sự kiện khi success contact form
        const toastSuccess = {
            title: 'Successful !',
            message: 'Successful account registration. Explore the NFT market now.',
            type: 'success',
            duration: 5000,
            icon: 'fa-solid fa-circle-check'
        }

        const toastError = {
            title: 'Fail !',
            message: 'Please enter the requirements of the form correctly.',
            type: 'error',
            duration: 5000,
            icon: 'fa-solid fa-circle-exclamation'
        }

        function toast(toastSuccess) {
            const mainToast = document.querySelector('#toast');
            if (mainToast) {
                const toast = document.createElement('div');
                const delay = (toastSuccess.duration / 1000).toFixed(2);

                toast.classList.add('toast', `toast--${toastSuccess.type}`);
                toast.style.animation = `slideInLeft .3s ease, fadeOut linear 1s ${delay}s forwards`;
                toast.innerHTML = `
                <div class="toast__icon">
                    <i class="${toastSuccess.icon}"></i>
                </div>
                    <div class="toast__body">
                        <h3 class="toast__title">${toastSuccess.title}</h3>
                        <p class="toast__msg">${toastSuccess.message}</p>
                    </div>
                    <div class="toast__close">
                        <i class="fa-solid fa-xmark"></i>
                    </div>
                `;
                mainToast.appendChild(toast);

                // Auto remove toast
                const autoRemoveToast = setTimeout(() => {
                    mainToast.removeChild(toast)
                }, toastSuccess.duration + 1000);

                // Remove toast when click
                toast.onclick = function (e) {
                    if (e.target.closest('.toast__close')) {
                        mainToast.removeChild(toast);
                        clearTimeout(autoRemoveToast);
                    }
                }
            }
        }

        // Lặp qua mỗi rule và xử lí (lắng nghe sự kiện blur, input, ... )
        options.rules.forEach((rule) => {
            // Lưu lại các rules cho mỗi input
            if (Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test);
            } else {
                selectorRules[rule.selector] = [rule.test];
            }

            const inputElements = formElement.querySelectorAll(rule.selector);
            Array.from(inputElements).forEach((inputElement) => {
                // Xử lí trường hợp khi blur ra khỏi input
                inputElement.onblur = function () {
                    validate(inputElement, rule);
                }
                // Xử lí mỗi khi người dùng nhập vào input
                inputElement.oninput = function () {
                    const errorElement = inputElement.closest(options.formGroupSelector).querySelector(options.errorSelector);
                    errorElement.innerText = '';
                    inputElement.closest(options.formGroupSelector).classList.remove('invalid');
                }
            });
        });
    }
};


// Định nghĩa các rules
// Nguyên tắc của các rule
// 1. khi có lỗi => trả ra message lỗi
// 2. khi hợp lệ => không trả ra gì cả (undefined)
Validator.isRequired = function (selector, message) {
    return {
        selector,
        test: function (value) {
            let result;
            if (typeof value === 'string') {
                result = value.trim() ? undefined : message || 'Vui lòng nhập trường này !';
            } else {
                result = value ? undefined : message || 'Vui lòng nhập trường này !';
            }
            return result;
        }
    };
}

Validator.isEmail = function (selector, message) {
    return {
        selector,
        test: function (value) {
            const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : message || 'Trường này phải là email !';
        }
    };
};

Validator.minLength = function (selector, min, message) {
    return {
        selector,
        test: function (value) {
            return value.trim().length >= min ? undefined : message || `Vui lòng nhập tối thiểu ${min} kí tự !`;
        }
    };
}

Validator.isConfirmed = function (selector, getConfirmValue, message) {
    return {
        selector,
        test: function (value) {
            return value.trim() === getConfirmValue() ? undefined : message || 'Giá trị nhập vào không chính xác !';
        }
    };
}