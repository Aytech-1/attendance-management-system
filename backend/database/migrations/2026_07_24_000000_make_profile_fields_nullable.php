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
        Schema::table('staff_profiles', function (Blueprint $table) {
            $table->string('title')->nullable()->change();
            $table->string('phone')->nullable()->change();
            $table->string('gender')->nullable()->change();
        });

        Schema::table('student_profiles', function (Blueprint $table) {
            $table->string('phone')->nullable()->change();
            $table->string('gender')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('staff_profiles', function (Blueprint $table) {
            $table->string('title')->nullable(false)->change();
            $table->string('phone')->nullable(false)->change();
            $table->string('gender')->nullable(false)->change();
        });

        Schema::table('student_profiles', function (Blueprint $table) {
            $table->string('phone')->nullable(false)->change();
            $table->string('gender')->nullable(false)->change();
        });
    }
};
