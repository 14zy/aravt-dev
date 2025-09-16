import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { api } from '@/lib/api';
import { RegistrationData } from '@/types';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useAuthStore } from '@/store/auth';

const SignUp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const referralInfo = useAuthStore(state => state.referralInfo);
  
  useEffect(() => {
    // Parse referral data from URL on component mount
    const searchParams = new URLSearchParams(location.search);
    const ref = searchParams.get('ref');
    const aravtId = searchParams.get('aravtId');

    // Only set referral info if we don't already have it or if URL has new info
    if ((ref || aravtId) && (!referralInfo || 
        ref !== referralInfo.referredById?.toString() || 
        aravtId !== referralInfo.aravtId?.toString())) {
      useAuthStore.getState().setReferralInfo({
        referredById: ref ? parseInt(ref) : undefined,
        aravtId: aravtId ? parseInt(aravtId) : undefined,
      });
    }
  }, [location, referralInfo]);

  const [formData, setFormData] = useState<RegistrationData>({
    username: '',
    email: '',
    password: '',
    city: '',
    date_of_birth: '',
    full_name: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement> | Date | null) => {
    let name: string;
    let value: string;

    if (e instanceof Date) {
      name = 'date_of_birth';
      value = e.toISOString().split('T')[0]; // Format date to yyyy-mm-dd
    } else if (e && 'target' in e) {
      name = e.target.name;
      value = e.target.value;
    } else {
      return; // Handle null case
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const registrationData = {
        ...formData,
        refered_by_id: referralInfo?.referredById
      };
      
      await api.register(registrationData);
      // Navigate to login while preserving referral info in the URL
      alert('Registration successful! Please confirm your e-mail before logging in.');
      if (referralInfo) {
        navigate(`/login?ref=${referralInfo.referredById}${
          referralInfo.aravtId ? `&aravtId=${referralInfo.aravtId}` : ''
        }`);
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-center text-3xl font-bold">Sign Up Registration</h2>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="username" className="sr-only">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-100"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                name="email"
                type="text"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-100"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-100"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                />
            </div>
            <div>
              <label htmlFor="city" className="sr-only">City</label>
              <input
                id="city"
                name="city"
                type="text"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-100"
                placeholder="City"
                value={formData.city}
                onChange={handleChange}
                />
            </div>
            <div className="mb-6">
              <label htmlFor="date_of_birth" className="sr-only">Date of Birth</label>
              <DatePicker
                id="date_of_birth"
                name="date_of_birth"
                selected={formData.date_of_birth ? new Date(formData.date_of_birth) : null}
                onChange={(date) => handleChange(date)}
                dateFormat="yyyy-MM-dd"
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-100"
                placeholderText="Select date of birth"
                required
                showYearDropdown
                yearDropdownItemNumber={100}
                scrollableYearDropdown
                showMonthDropdown
                popperClassName="datepicker-popover"
                wrapperClassName="w-full"
              />
            </div>
            <div>
              <label htmlFor="full_name" className="sr-only">Full name</label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-100"
                placeholder="Full name"
                value={formData.full_name}
                onChange={handleChange}
                />
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Sign Up
            </button>
          </div>
        </form>
        <div className="text-sm text-center text-gray-500">
          By connecting, you agree to our Terms of Service and Privacy Policy
        </div>
        <div className="text-center text-sm mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SignUp;