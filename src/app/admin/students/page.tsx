'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, Search, Mail, Phone, Hash, Bookmark } from 'lucide-react';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('All');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const depts = ['All', 'CSE', 'ISE', 'ECE', 'EEE', 'ME', 'CE'];

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data } = await supabase
          .from('students')
          .select('*')
          .order('name', { ascending: true });

        if (data) setStudents(data);
      } catch (err) {
        console.error('Error fetching students:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const filteredStudents = students.filter((s) => {
    const query = search.toLowerCase();
    const matchesSearch =
      s.name.toLowerCase().includes(query) ||
      s.usn.toLowerCase().includes(query) ||
      s.email.toLowerCase().includes(query);
    const matchesDept = dept === 'All' || s.dept === dept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-8 animate-slide-up text-left">
      {/* Title */}
      <div className="pb-4 border-b border-brand-brown/5">
        <h2 className="text-3xl font-black text-brand-black">Student Database</h2>
        <p className="text-sm text-brand-brown/70 font-medium">Browse student profiles, departments, and roll numbers.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-brand-brown/40" />
          <input
            type="text"
            placeholder="Search name, USN, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-brand-brown/15 rounded-xl outline-none focus:border-brand-brown focus:bg-white text-brand-black transition-all text-xs font-semibold"
          />
        </div>

        {/* Dept Filter */}
        <select
          value={dept}
          onChange={(e) => setDept(e.target.value)}
          className="w-full sm:w-48 px-4 py-2.5 bg-white border border-brand-brown/15 rounded-xl outline-none focus:border-brand-brown text-xs font-semibold text-brand-brown"
        >
          {depts.map((d) => (
            <option key={d} value={d}>
              {d === 'All' ? 'All Departments' : `${d} Dept`}
            </option>
          ))}
        </select>
      </div>

      {/* Database View */}
      <div className="glass-panel rounded-3xl p-6 border border-white/50">
        {loading ? (
          <div className="h-44 bg-brand-brown/5 animate-pulse rounded-2xl" />
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-brand-brown/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-brand-black">No student profiles found</h3>
            <p className="text-xs text-brand-brown/60 mt-1">Students will appear here once they register an account on the sign-up page.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-[10px] font-extrabold uppercase text-brand-brown/45 border-b border-brand-brown/5">
                  <th className="pb-3 pl-2">Full Name</th>
                  <th className="pb-3">USN / Roll</th>
                  <th className="pb-3">Department</th>
                  <th className="pb-3">Year</th>
                  <th className="pb-3">Email Address</th>
                  <th className="pb-3 pr-2 text-right">Phone Number</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-brown/5 font-semibold text-xs text-brand-brown/85">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-brand-brown/2 transition-colors">
                    <td className="py-3.5 pl-2 text-brand-black font-extrabold">{student.name}</td>
                    <td className="py-3.5 uppercase">{student.usn}</td>
                    <td className="py-3.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider bg-brand-brown/5 border border-brand-brown/10 px-2.5 py-0.5 rounded">
                        {student.dept}
                      </span>
                    </td>
                    <td className="py-3.5">Year {student.year}</td>
                    <td className="py-3.5">{student.email}</td>
                    <td className="py-3.5 pr-2 text-right">{student.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
