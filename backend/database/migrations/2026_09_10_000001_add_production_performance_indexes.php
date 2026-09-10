<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->index(['lecture_session_id', 'status'], 'idx_attendances_session_status');
            $table->index('scanned_at', 'idx_attendances_scanned_at');
        });

        Schema::table('lecture_sessions', function (Blueprint $table) {
            $table->index(['date', 'status'], 'idx_sessions_date_status');
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->index(['department_id', 'lecturer_id'], 'idx_courses_dept_lecturer');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropIndex('idx_attendances_session_status');
            $table->dropIndex('idx_attendances_scanned_at');
        });

        Schema::table('lecture_sessions', function (Blueprint $table) {
            $table->dropIndex('idx_sessions_date_status');
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->dropIndex('idx_courses_dept_lecturer');
        });
    }
};
