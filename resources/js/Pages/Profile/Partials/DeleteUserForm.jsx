import DangerButton from '@/Components/DangerButton';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import DeleteAccountModal from '@/Components/modals/DeleteAccountModal';

export default function DeleteUserForm({ className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Delete Account
                </h2>

                <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
                    Once your account is deleted, all of its resources and data
                    will be permanently deleted. Before deleting your account,
                    please download any data or information that you wish to
                    retain.
                </p>
            </header>

            <DangerButton onClick={confirmUserDeletion}>
                Delete Account
            </DangerButton>

            <DeleteAccountModal
                show={confirmingUserDeletion}
                onClose={closeModal}
                onDelete={deleteUser}
                passwordValue={data.password}
                setPasswordValue={(val) => setData('password', val)}
                errors={errors}
                processing={processing}
                passwordInputRef={passwordInput}
            />
        </section>
    );
}
